import {basename} from 'node:path';
export function isActualProfiledWorker(executablePath){
 return basename(executablePath)==='WPEWebProcess.heaptrack-original';
}
