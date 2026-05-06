// Live Wix CDN image URLs, extracted from pxlclock.com via Playwright DOM inspection.
// Two galleries × 14 portraits each (the live site cycles through ~28 unique images).

const baseFill = (id: string) =>
  `https://static.wixstatic.com/media/${id}/v1/fill/w_506,h_676,q_85,enc_avif,quality_auto/${id.split('~')[0]}.avif`;

const portraits = [
  '5d430b_5842ea6774ad46b790df3ea307cad0e3~mv2.jpg',
  '5d430b_71200b256417480ca99989706547bc9d~mv2.jpg',
  '5d430b_2443992b01cb430983badab9937de817~mv2.jpg',
  '5d430b_f019c281e639426f9d75d3624374a115~mv2.jpg',
  '5d430b_12f3d691c7fe4f9485913883e84f35fd~mv2.jpg',
  '5d430b_1fde9a3a8583436f99e8e0b6ca68045e~mv2.jpg',
  '5d430b_24876d92c84c4c008a6b5e1b88d48381~mv2.jpg',
  '5d430b_d5c3c3b79124417a8b2d8ef95d7f460c~mv2.jpg',
  '5d430b_1e16183eca2e4e27ad43c44bc78644fe~mv2.jpg',
  '5d430b_8fcd387792b9474fae292a486dfdccfb~mv2.jpg',
  '5d430b_0b90d8e1fef74c74a649c40d96fe169c~mv2.jpg',
  '5d430b_dd973ddc098a4fc4b58a751195bf11ec~mv2.jpg',
  '5d430b_3383d7c9c1b74d6ab1fd358cd0488c32~mv2.jpg',
  '5d430b_bea8251d4513413bb0bbd68b931964bb~mv2.jpg',
  '5d430b_1d26531ce7d64048a5b078325b6e8d0f~mv2.jpg',
  '5d430b_fcf22499e4bb4150b5e4e4aff526a1bf~mv2.jpg',
  '5d430b_65fa5399f1f6428f91c4ffd8f2589c81~mv2.jpg',
  '5d430b_6e9b438c05f34a138341c6da715c7afe~mv2.jpg',
  '5d430b_3771ea522f2c42ea96f49cea623e795a~mv2.jpg',
  '5d430b_849b3e56ae884d97bc4317ec135c0c1b~mv2.jpg',
  '5d430b_bbb23226bacc40e4a977aee958861cab~mv2.jpg',
];

export const lifestyleGallery: string[] = portraits.slice(0, 14).map(baseFill);
export const workshopGallery: string[] = portraits.slice(7, 21).map(baseFill);

export const shapeSpacesBg =
  'https://static.wixstatic.com/media/5d430b_d40cc83aea57410d8f9a71e9a299ab8c~mv2.jpg/v1/fill/w_1920,h_900,al_c,q_90,enc_avif,quality_auto/shape.avif';

export const startedBg =
  'https://static.wixstatic.com/media/5d430b_f1e3cda1718b41d0b40fe277ff6de803~mv2.jpg/v1/fill/w_1920,h_900,al_c,q_90,enc_avif,quality_auto/started.avif';
