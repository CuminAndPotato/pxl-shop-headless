// Self-hosted asset paths. All images live in public/img and are served from
// the same origin as the site — no third-party CDN dependency.

const portrait = (id: string) => `/img/gallery/${id}.avif`;

const portraits = [
  '5d430b_5842ea6774ad46b790df3ea307cad0e3',
  '5d430b_71200b256417480ca99989706547bc9d',
  '5d430b_2443992b01cb430983badab9937de817',
  '5d430b_f019c281e639426f9d75d3624374a115',
  '5d430b_12f3d691c7fe4f9485913883e84f35fd',
  '5d430b_1fde9a3a8583436f99e8e0b6ca68045e',
  '5d430b_24876d92c84c4c008a6b5e1b88d48381',
  '5d430b_d5c3c3b79124417a8b2d8ef95d7f460c',
  '5d430b_1e16183eca2e4e27ad43c44bc78644fe',
  '5d430b_8fcd387792b9474fae292a486dfdccfb',
  '5d430b_0b90d8e1fef74c74a649c40d96fe169c',
  '5d430b_dd973ddc098a4fc4b58a751195bf11ec',
  '5d430b_3383d7c9c1b74d6ab1fd358cd0488c32',
  '5d430b_bea8251d4513413bb0bbd68b931964bb',
  '5d430b_1d26531ce7d64048a5b078325b6e8d0f',
  '5d430b_fcf22499e4bb4150b5e4e4aff526a1bf',
  '5d430b_65fa5399f1f6428f91c4ffd8f2589c81',
  '5d430b_6e9b438c05f34a138341c6da715c7afe',
  '5d430b_3771ea522f2c42ea96f49cea623e795a',
  '5d430b_849b3e56ae884d97bc4317ec135c0c1b',
  '5d430b_bbb23226bacc40e4a977aee958861cab',
];

export const lifestyleGallery: string[] = portraits.slice(0, 14).map(portrait);
export const workshopGallery: string[] = portraits.slice(7, 21).map(portrait);

export const shapeSpacesBg = '/img/sections/shape-spaces.avif';
export const startedBg = '/img/sections/started.avif';
