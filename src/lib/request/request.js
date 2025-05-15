// 基础配置
export const BASE_URL = 'http://10.21.145.217:8000';

// 通用请求封装
export default async function request(config) {
  // 合并默认配置
  const {
    url,
    method = 'GET',
    data = null,
    headers = {},
    responseType = 'json'
  } = config;

  // 请求拦截器（示例）
  if (typeof requestInterceptor === 'function') {
    await requestInterceptor(config);
  }

  // 处理请求参数
  const requestConfig = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  // GET请求参数处理
  if (method.toUpperCase() === 'GET' && data) {
    const params = new URLSearchParams(data).toString();
    config.url += `?${params}`;
  } else if (data) {  // 非GET请求体处理
    requestConfig.body = JSON.stringify(data);
  }

  try {
    console.log('here',config.url);

    const response = await fetch(BASE_URL + config.url, requestConfig);

/*     // 响应状态检查
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } */

    // 响应数据处理
    const responseData = await (responseType === 'text'
      ? response.text()
      : response.json());

    console.log('response', responseData)

/*     // 响应拦截器（示例）
    if (typeof responseInterceptor === 'function') {
      return responseInterceptor(responseData);
    } */

    return responseData;
  } catch (error) {
    // 统一错误处理
    console.error('Request failed:', error);
    throw new Error(`请求失败: ${error.message}`);
  }
}

// 请求拦截器示例
async function requestInterceptor(config) {
  // 可在此处添加认证token等
  // config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
}

// 响应拦截器示例
function responseInterceptor(response) {
  // 处理通用响应格式
  return response.data;
}

request.BASE_URL = BASE_URL;

/**************** 使用示例 ****************/
// GET请求
const getData = async () => {
  try {
    return await request({
      url: 'users',
      params: { page: 1 }
    });
  } catch (error) {
    // 处理错误
  }
}

// POST请求
const postData = async () => {
  try {
    return await request({
      url: 'users',
      method: 'POST',
      data: { name: 'John' }
    });
  } catch (error) {
    // 处理错误
  }
}
