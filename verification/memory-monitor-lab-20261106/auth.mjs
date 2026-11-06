const no=()=>{},done=async()=>{};
export function useAuth(){return {user:null,canAdmin:false,adminMode:false,isAuthenticated:false,showSignIn:false,isLoading:false,authReady:true,authError:'',signIn:done,signOut:done,refreshSession:done,closeSignIn:no,requireAuth:no,setAdminPreview:async()=>{throw Error('Isolated lab only');}};}
