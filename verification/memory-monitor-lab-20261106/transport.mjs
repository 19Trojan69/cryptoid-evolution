import axios,{AxiosError,AxiosHeaders} from 'axios';
export const PI_ACCESS_TOKEN_KEY='memory-lab-unused';
export const ADMIN_TEST_HEADER='x-memory-lab-unused';
export const getBaseURL=()=>'/api';
export async function reply(config){
  const method=String(config.method||'get').toUpperCase(),path=config.url;
  let data;
  if(method==='GET'&&path==='/hangar/catalog')data={offers:[]};
  else if(method==='GET'&&path==='/leaderboard/top')data={leaders:[],network:'testnet'};
  else {const response={data:{error:'isolated_lab_no_backend'},status:403,statusText:'Forbidden',headers:new AxiosHeaders(),config};throw new AxiosError('Isolated lab denied','ERR_BAD_REQUEST',config,undefined,response);}
  return {data,status:200,statusText:'OK',headers:new AxiosHeaders(),config};
}
export const axiosClient=axios.create({baseURL:'/api',adapter:reply});
