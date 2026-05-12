#!/usr/bin/env dotnet fsi
// Render PXL pixograms to .pxl text files for the in-browser canvas player.
// Pulls source from the public pxl-clock GitHub repo and renders via the
// `pxl-render` CLI (Pxl.Render NuGet, installed as a global dotnet tool).
//
// Run:
//   dotnet fsi scripts/render-pixograms.fsx
//
// One-time setup:
//   dotnet tool install --global Pxl.Render
//
// Env overrides:
//   PXL_CLOCK_REPO   GitHub owner/repo                (default: SchlenkR/pxl-clock)
//   PXL_CLOCK_BRANCH branch / tag / sha               (default: main)

#r "nuget: Spectre.Console, 0.49.1"

open System
open System.IO
open System.Net.Http
open System.Diagnostics
open System.Text.Json
open System.Text.RegularExpressions
open Spectre.Console

// === Config ================================================================
let rootDir = Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, ".."))
let outDir = Path.Combine(rootDir, "public", "pixograms")

let envOr (name: string) (fallback: string) =
    match Environment.GetEnvironmentVariable name with
    | null | "" -> fallback
    | v -> v

let repo = envOr "PXL_CLOCK_REPO" "SchlenkR/pxl-clock"
let branch = envOr "PXL_CLOCK_BRANCH" "main"

// Source folders we showcase. `apps/demos` is intentionally excluded.
let sourcePrefixes = [
    "apps/clockFaces/",        "ClockFace"
    "apps/scenes/sailorship/", "Scene"
]

// === HTTP ==================================================================
let http = new HttpClient()
http.DefaultRequestHeaders.Add("User-Agent", "pxl-shop-headless-renderer")

let escape (s: string) = Markup.Escape(s)

// === Domain ================================================================
type Pixogram = {
    Slug: string
    File: string
    DisplayName: string
    Author: string
    Description: string
    AppType: string
    Type: string
    Path: string
    Source: string
}

// === Frontmatter parser ====================================================
let parseFrontmatter (content: string) =
    let lines = content.Split('\n')
    let limit = min lines.Length 40
    let mutable startIdx, endIdx = -1, -1
    let mutable i = 0
    while i < limit && (startIdx = -1 || endIdx = -1) do
        if lines.[i].Trim() = "// ---" then
            if startIdx = -1 then startIdx <- i
            elif endIdx = -1 then endIdx <- i
        i <- i + 1
    if startIdx = -1 || endIdx = -1 then Map.empty
    else
        seq {
            for j in (startIdx + 1) .. (endIdx - 1) do
                let m = Regex.Match(lines.[j], @"^//\s*(\w+)\s*:\s*(.*)$")
                if m.Success then
                    yield (m.Groups.[1].Value, m.Groups.[2].Value.Trim())
        } |> Map.ofSeq

// === GitHub fetching =======================================================
// Single tree API call lists every file in the repo. Source bodies come from
// raw.githubusercontent.com which is a CDN and not rate-limited.
let fetchTree () : Async<string list> =
    async {
        let url = $"https://api.github.com/repos/{repo}/git/trees/{branch}?recursive=1"
        let! body = http.GetStringAsync(url) |> Async.AwaitTask
        use doc = JsonDocument.Parse(body)
        let tree = doc.RootElement.GetProperty("tree")
        return [
            for entry in tree.EnumerateArray() do
                let typ = entry.GetProperty("type").GetString()
                let path = entry.GetProperty("path").GetString()
                if typ = "blob" && path.EndsWith(".cs") then yield path
        ]
    }

let fetchRaw (path: string) : Async<string> =
    async {
        let url = $"https://raw.githubusercontent.com/{repo}/{branch}/{path}"
        return! http.GetStringAsync(url) |> Async.AwaitTask
    }

let discoverPixograms () : Async<Pixogram list> =
    async {
        let! tree = fetchTree ()
        let matching =
            tree
            |> List.choose (fun path ->
                sourcePrefixes
                |> List.tryFind (fun (prefix, _) -> path.StartsWith(prefix))
                |> Option.map (fun (_, t) -> path, t))
            |> List.sortBy fst
        let! sources =
            matching
            |> List.map (fun (path, _) -> async {
                let! body = fetchRaw path
                return path, body
            })
            |> Async.Parallel
        let sourceMap = sources |> Array.map (fun (p, s) -> p, s) |> Map.ofArray
        return
            matching
            |> List.map (fun (path, typ) ->
                let body = sourceMap.[path]
                let meta = parseFrontmatter body
                let fileName = Path.GetFileNameWithoutExtension(path)
                let slug =
                    (meta |> Map.tryFind "app" |> Option.defaultValue fileName).ToLowerInvariant()
                {
                    Slug = slug
                    File = $"{slug}.pxl"
                    DisplayName = meta |> Map.tryFind "displayName" |> Option.defaultValue slug
                    Author = meta |> Map.tryFind "author" |> Option.defaultValue ""
                    Description = meta |> Map.tryFind "description" |> Option.defaultValue ""
                    AppType = meta |> Map.tryFind "appType" |> Option.defaultValue typ
                    Type = typ
                    Path = path
                    Source = body
                })
    }

// === Pxl.Render via dotnet tool exec =======================================
// .NET 10 lets us run a NuGet-packaged tool transiently without a global
// install: `dotnet tool exec --yes Pxl.Render <args>`. The package gets
// downloaded once into the dotnet tool cache, no PATH set-up required, the
// user's environment stays untouched.

// === UI ====================================================================
let printBanner () =
    AnsiConsole.Write(FigletText("PXL Render").Centered().Color(Color.Gold1))
    let rule = Rule($"[grey]github.com/{escape repo}@{escape branch}  ·  rendered with[/] [yellow]pxl-render[/]")
    rule.Justification <- Justify.Center
    rule.Style <- Style.Parse "grey"
    AnsiConsole.Write(rule)
    AnsiConsole.WriteLine()

let typeMarkup t =
    match t with
    | "ClockFace" -> "[deepskyblue1]ClockFace[/]"
    | "Scene"     -> "[magenta1]Scene[/]"
    | other       -> escape other

let printDiscoveryTable (pixograms: Pixogram list) (existing: Set<string>) =
    let table = Table()
    table.Border <- TableBorder.Rounded
    table.BorderColor(Color.Grey39) |> ignore
    table.AddColumn(TableColumn("[grey]#[/]").Centered()) |> ignore
    table.AddColumn("Type") |> ignore
    table.AddColumn("Pixogram") |> ignore
    table.AddColumn("[dim]Author[/]") |> ignore
    table.AddColumn(TableColumn("[dim]Status[/]").Centered()) |> ignore
    pixograms
    |> List.iteri (fun i p ->
        let status =
            if existing.Contains(p.File) then "[green]rendered[/]"
            else "[dim]—[/]"
        table.AddRow(
            $"[grey]{i + 1}[/]",
            typeMarkup p.Type,
            $"[bold]{escape p.DisplayName}[/]",
            (if String.IsNullOrEmpty p.Author then "[dim]—[/]" else escape p.Author),
            status
        ) |> ignore)
    AnsiConsole.Write(table)

let chooseScope (pixograms: Pixogram list) (existing: Set<string>) : Pixogram list =
    let missing = pixograms |> List.filter (fun p -> not (existing.Contains p.File))
    let opts = [
        "Pick from a list"
        $"Render all ({pixograms.Length})"
        (if missing.Length > 0 then $"Only missing ({missing.Length})" else "Only missing (none)")
        "Cancel"
    ]
    let prompt = SelectionPrompt<string>()
    prompt.Title <- "[bold yellow]What would you like to do?[/]"
    prompt.PageSize <- 5
    prompt.HighlightStyle <- Style.Parse "yellow bold"
    prompt.AddChoices(opts :> seq<_>) |> ignore

    match AnsiConsole.Prompt(prompt) with
    | "Cancel" -> AnsiConsole.MarkupLine("[grey]Bye.[/]"); exit 0; []
    | s when s.StartsWith "Render all" -> pixograms
    | s when s.StartsWith "Only missing" -> missing
    | _ ->
        let mp = MultiSelectionPrompt<Pixogram>()
        mp.Title <- "[bold yellow]Select pixograms[/]  [dim](space to toggle · enter to confirm)[/]"
        mp.PageSize <- 20
        mp.HighlightStyle <- Style.Parse "yellow bold"
        mp.InstructionsText <- "[grey](press [yellow]<space>[/] to toggle, [yellow]<enter>[/] to confirm)[/]"
        mp.UseConverter(fun p ->
            let marker = if existing.Contains(p.File) then "[green]↻[/]" else "  "
            let typeColor = match p.Type with | "ClockFace" -> "deepskyblue1" | "Scene" -> "magenta1" | _ -> "grey"
            let author = if String.IsNullOrEmpty p.Author then "" else $" [dim]· {escape p.Author}[/]"
            $"{marker} [{typeColor}]{p.Type,-10}[/] [bold]{escape p.DisplayName}[/]{author}") |> ignore
        mp.AddChoices(pixograms :> seq<_>) |> ignore
        AnsiConsole.Prompt(mp) |> List.ofSeq

let askDuration () =
    let prompt = TextPrompt<float>("[grey]Duration (seconds)?[/]")
    prompt.DefaultValueStyle <- Style.Parse "yellow"
    prompt.DefaultValue(60.0) |> ignore
    prompt.ShowDefaultValue <- true
    AnsiConsole.Prompt(prompt)

let askFps () =
    let prompt = TextPrompt<int>("[grey]FPS?[/]")
    prompt.DefaultValueStyle <- Style.Parse "yellow"
    prompt.DefaultValue(5) |> ignore
    prompt.ShowDefaultValue <- true
    AnsiConsole.Prompt(prompt)

// === Render ================================================================
type RenderResult =
    | Ok of Pixogram * sizeKb: int64 * seconds: float
    | Failed of Pixogram * message: string

let render (p: Pixogram) (duration: float) (fps: int) : RenderResult =
    // pxl-render compiles the .cs file from disk; write the GitHub source to
    // a per-run temp file, run the tool, clean up. Keeps render hermetic — no
    // checkout of pxl-clock required, and `dotnet tool exec` keeps the tool
    // itself transient (no global install touching the user's environment).
    let temp = Path.Combine(Path.GetTempPath(), $"pxl-{p.Slug}-{Guid.NewGuid()}.cs")
    File.WriteAllText(temp, p.Source)
    let outPath = Path.Combine(outDir, p.File)
    let pi = ProcessStartInfo("dotnet")
    pi.ArgumentList.Add("tool")
    pi.ArgumentList.Add("exec")
    pi.ArgumentList.Add("--yes")
    pi.ArgumentList.Add("Pxl.Render")
    pi.ArgumentList.Add(temp)
    pi.ArgumentList.Add("--output");   pi.ArgumentList.Add(outPath)
    pi.ArgumentList.Add("--duration"); pi.ArgumentList.Add(string duration)
    pi.ArgumentList.Add("--fps");      pi.ArgumentList.Add(string fps)
    pi.ArgumentList.Add("--mode");     pi.ArgumentList.Add("raw")
    pi.RedirectStandardError <- true
    pi.RedirectStandardOutput <- true
    pi.UseShellExecute <- false
    let sw = Stopwatch.StartNew()
    use proc = Process.Start(pi)
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()
    sw.Stop()
    try File.Delete(temp) with _ -> ()
    if proc.ExitCode = 0 && File.Exists(outPath) then
        Ok (p, FileInfo(outPath).Length / 1024L, sw.Elapsed.TotalSeconds)
    else
        Failed (p, stderr.Trim())

let runRenders (selection: Pixogram list) (duration: float) (fps: int) : RenderResult list =
    Directory.CreateDirectory(outDir) |> ignore
    let results = ResizeArray<RenderResult>()
    let progress = AnsiConsole.Progress()
    progress.Columns([|
        TaskDescriptionColumn() :> ProgressColumn
        ProgressBarColumn() :> ProgressColumn
        PercentageColumn() :> ProgressColumn
        ElapsedTimeColumn() :> ProgressColumn
    |]) |> ignore
    progress.Start(fun ctx ->
        let overall = ctx.AddTask($"[yellow]Rendering {selection.Length} pixograms[/]", true, float selection.Length)
        for p in selection do
            let task = ctx.AddTask($"  [grey]{escape p.DisplayName}[/]", true, 1.0)
            results.Add(render p duration fps)
            task.Increment(1.0)
            overall.Increment(1.0))
    results |> List.ofSeq

// === Index.json ============================================================
let writeIndex (all: Pixogram list) (duration: float) (fps: int) =
    let present =
        Directory.GetFiles(outDir, "*.pxl")
        |> Array.map (fun f -> Path.GetFileNameWithoutExtension(f).ToLowerInvariant())
        |> Set.ofArray
    let items =
        all
        |> List.filter (fun p -> present.Contains p.Slug)
        |> List.map (fun p ->
            {| slug = p.Slug; file = p.File; displayName = p.DisplayName
               author = p.Author; description = p.Description; appType = p.AppType
               ``type`` = p.Type; duration = duration; fps = fps |})
    let payload =
        {| generatedAt = DateTime.UtcNow.ToString("o")
           source = $"{repo}@{branch}"
           width = 24; height = 24
           duration = duration; fps = fps
           count = items.Length; items = items |}
    let opts = JsonSerializerOptions(WriteIndented = true)
    let path = Path.Combine(outDir, "index.json")
    File.WriteAllText(path, JsonSerializer.Serialize(payload, opts))
    path, items.Length

let printSummary (results: RenderResult list) (indexPath: string) (indexed: int) =
    AnsiConsole.WriteLine()
    let okList     = results |> List.choose (function Ok (p, kb, t) -> Some (p, kb, t) | _ -> None)
    let failedList = results |> List.choose (function Failed (p, m) -> Some (p, m) | _ -> None)
    let totalKb  = okList |> List.sumBy (fun (_, kb, _) -> kb)
    let totalSec = okList |> List.sumBy (fun (_, _, t) -> t)
    let table = Table()
    table.Border <- TableBorder.MinimalDoubleHead
    table.AddColumn("[grey]Pixogram[/]") |> ignore
    table.AddColumn(TableColumn("[grey]Size[/]").RightAligned()) |> ignore
    table.AddColumn(TableColumn("[grey]Time[/]").RightAligned()) |> ignore
    table.AddColumn(TableColumn("[grey]Status[/]").Centered()) |> ignore
    for (p, kb, t) in okList do
        table.AddRow($"[bold]{escape p.DisplayName}[/]", $"[grey]{kb} KB[/]", $"[grey]{t:F1}s[/]", "[green]✓[/]") |> ignore
    for (p, m) in failedList do
        let short = if m.Length > 80 then m.Substring(0, 80) + "…" else m
        table.AddRow($"[bold]{escape p.DisplayName}[/]", "[grey]—[/]", "[grey]—[/]", $"[red]✗[/] [dim]{escape short}[/]") |> ignore
    AnsiConsole.Write(table)
    AnsiConsole.WriteLine()
    AnsiConsole.MarkupLine(
        $"[green]✓ {okList.Length}[/] rendered  [dim]·[/]  [red]✗ {failedList.Length}[/] failed  [dim]·[/]  [bold]{float totalKb / 1024.0:F1} MB[/]  [dim]·[/]  [bold]{totalSec:F1}s[/]")
    AnsiConsole.MarkupLine(
        $"[grey]Index covers[/] [bold]{indexed}[/] [grey]pixograms[/] [link]{escape (Path.GetRelativePath(rootDir, indexPath))}[/]")

// === main ==================================================================
printBanner()

let pixograms =
    AnsiConsole
        .Status()
        .Start($"[grey]Fetching pixogram list from {escape repo}@{escape branch}…[/]",
            fun _ -> discoverPixograms () |> Async.RunSynchronously)

if pixograms.IsEmpty then
    AnsiConsole.MarkupLine("[red]No .cs pixogram files found in the configured prefixes.[/]")
    exit 1

let existing =
    if Directory.Exists(outDir) then
        Directory.GetFiles(outDir, "*.pxl")
        |> Array.map Path.GetFileName
        |> Set.ofArray
    else Set.empty

AnsiConsole.MarkupLine(
    $"[green]Found {pixograms.Length} pixograms on GitHub[/] [dim]· {existing.Count} already rendered locally[/]")
AnsiConsole.WriteLine()
printDiscoveryTable pixograms existing
AnsiConsole.WriteLine()

let selection = chooseScope pixograms existing
if selection.IsEmpty then
    AnsiConsole.MarkupLine("[grey]Nothing selected. Bye.[/]")
    exit 0

let duration = askDuration()
let fps = askFps()
AnsiConsole.WriteLine()

let results = runRenders selection duration fps
let indexPath, indexed = writeIndex pixograms duration fps
printSummary results indexPath indexed
