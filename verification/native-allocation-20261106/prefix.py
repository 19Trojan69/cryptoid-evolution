#!/usr/bin/python3
import os,sys,json,pathlib,resource,shutil
cohort=os.environ.get('CRYPTOID_ALLOCATION_COHORT')
assert cohort in ['control-page','prepared-menu','paused-scene']
assert len(sys.argv)>=4
exe=pathlib.Path(sys.argv[1]).name
assert exe in ['WPEWebProcess','WebKitWebProcess'],exe
root=pathlib.Path(__file__).resolve().parent/'results'/cohort
root.mkdir(parents=True,exist_ok=True)
mode=os.environ.get('CRYPTOID_HEAPTRACK_RECORD_ONLY');assert mode in ['yes','no']
if mode=='no':assert shutil.which('heaptrack_gui') is None
flags=['--record-only'] if mode=='yes' else []
pid=os.getpid()
prefix=root/('native-'+str(pid))
(root/('wrapper-'+str(pid)+'.json')).write_text(json.dumps({'wrapperPid':pid,'targetExecutable':exe,'outputPrefix':prefix.name,'cohort':cohort,'recordOnlyFlagUsed':mode=='yes'})+'\n')
# exec preserves WebKit's already inherited IPC descriptors.
resource.setrlimit(resource.RLIMIT_FSIZE,(128*1024*1024,128*1024*1024))
os.execv('/usr/bin/heaptrack',['heaptrack',*flags,'-o',str(prefix),'--',*sys.argv[1:]])
