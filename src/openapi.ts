import moment from 'moment';
import { AlipayOpenAPIConfig } from './constant';
import JSEncrypt from 'jsencrypt';
import CryptoJS from 'crypto-js';

// RSA 签名
const encrypt = new JSEncrypt();


const openAPIConfig: AlipayOpenAPIConfig = {
  gateway: 'https://openapi.alipay.com/gateway.do',
  timeout: 5000,
  charset: 'utf-8',
  version: '1.0',
  appId: '',
}

export async function callByOpenAPI(appId: string, key: string, name: string, modelId: string, version: string = '', maxAppId: string = '') {
  openAPIConfig.appId = appId;
  encrypt.setPrivateKey(key);
  
  const params = sign(name, {
    bizContent: {
      modelId,
      version,
      maxAppId: maxAppId
    },
  }, openAPIConfig)
  const encodedParams = encodeParams(params);
  // console.log('encodedParams :>> ', encodedParams);
  return encodedParams;
}

/**
 * 签名
 * @description https://opendocs.alipay.com/common/02kf5q
 * @param {string} method 调用接口方法名，比如 alipay.ebpp.bill.add
 * @param {object} bizContent 业务请求参数
 * @param {object} config sdk 配置
 */
export function sign(method: string, params: any = {}, config: AlipayOpenAPIConfig): any {
  let signParams = Object.assign({
    method,
    appId: config.appId,
    charset: config.charset,
    version: config.version,
    signType: "RSA2",
    timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
  });

  const bizContent = params.bizContent;
  if (bizContent) {
    signParams.bizContent = JSON.stringify(toSnakeCases(bizContent));
  }

  // params key 驼峰转下划线
  const deCamelizeParams = toSnakeCases(signParams);

  // 排序
  const signStr = Object.keys(deCamelizeParams).sort().map((key) => {
    let data = deCamelizeParams[key];
    if (Array.prototype.toString.call(data) !== '[object String]') {
      data = JSON.stringify(data);
    }
    return `${key}=${data}`;
  }).join('&');

  console.log('signStr :>> ', signStr);

  // 计算签名
  const sign = RSAEncrypt(signStr);

  return Object.assign(deCamelizeParams, { sign });
}

function RSAEncrypt(signStr: string) {
  const start = Date.now()
  const encrypted = encrypt.sign(signStr, CryptoJS.SHA256, "sha256");
  console.log('encrypted :>> ', encrypted, Date.now() - start);
  return encrypted;
}

// export async function callByOpenAPI(params: FetchModelConfig): Promise<FetchModelResult> {

// }

function toSnakeCases(params: Object) {
  const out = {};
  Object.keys(params).forEach(key => {
    const newKey = key.replace(/([A-Z])/g, (match) => ('_' + match.toLowerCase()))
    out[newKey] = params[key];
  })
  return out;
}

function encodeParams(params: Object) {
  const out = {};
  Object.keys(params).forEach(key => {
    out[key] = encodeURIComponent(params[key]);
  })
  return out;
}

