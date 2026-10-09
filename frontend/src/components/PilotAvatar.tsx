export type Avatar = {kind:'builtin';id:string}|{kind:'upload';image:string}|null;
const avatarSource=(avatar:Avatar)=>avatar?.kind==='upload'?avatar.image:`/pilots/${avatar?.kind==='builtin'?avatar.id:'helmet-1'}.svg`;
export default function PilotAvatar({avatar,name,className=''}:{avatar:Avatar;name:string;className?:string}){return <img className={`pilot-avatar ${className}`} src={avatarSource(avatar)} alt={name} width={128} height={128} loading="lazy"/>;}
