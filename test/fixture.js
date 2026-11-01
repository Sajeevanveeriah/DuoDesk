'use strict';
// Synthetic device state only. This module never reads the OS clipboard, devices or user settings.
const {normalize}=require('../windows/settings');
const Layout=require('../shared/layout');
function fixture(mode='pair',os='windows',scenario='desktop'){
 const s=normalize({rev:10});
 const displays=[{id:'pc',name:'Studio display',x:0,y:0,w:2560,h:1440,scale:1,primary:true}];
 const state={...s,updates:{current:'2.5.0',auto:false,skippedVersion:'',checking:false,latest:null,name:'',available:false,error:'',checkedAt:0,releaseUrl:'https://github.com/Sajeevanveeriah/DuoDesk/releases',releaseNotes:'',publishedAt:'',download:null,noReleases:false,skipped:false},version:'2.5.0',device:{id:'pc',name:'Studio PC',os:'win'},name:'Studio PC',macName:'Studio PC',macId:'pc',addresses:['192.0.2.10'],found:[],paired:null,hosts:[],guests:[],pairing:null,
 link:{state:'connected',macName:'MacBook',macId:'mac',os:'mac',address:'192.0.2.11',rtt:4},peer:{os:'mac',name:'MacBook',id:'mac'},connection:{connected:true,name:'MacBook',rtt:4},connected:true,
 discovery:{on:true,localNetwork:true,interfaces:[]},input:'home',kvmState:{mode:'home',linked:true,paused:false,allowed:true,helper:'',helperReady:true,mouse:true,keyboard:true,localDisplays:displays,remoteDisplays:[{...displays[0],id:'mac',w:1512,h:982}],map:{mine:displays,theirs:[],arrange:{side:'right',along:0}},lock:{on:false}},kvm:{...s.kvm,pcSide:'left',mouse:true,keyboard:true},
 clipboard:{...s.clipboard,enabled:true,imageSupport:true,peerAccepts:true,history:[{dir:'in',at:Date.now()-30000,text:'A little less switching. A little more flow.',size:48,from:'MacBook'}]},
 stream:{status:'idle',state:'idle',remote:true,watching:false},permissions:{screen:'granted',accessibility:true,inputMonitoring:true},setup:{missing:[],show:false},ui:{...s.ui,tab:'desk',setupDone:true},helper:{running:true,ready:true},
 phone:{connected:false,nearby:[],assets:0,info:{battery:82,model:'Pixel'},bridge:{state:'off',windows:[],adb:{available:false}},settings:s.phone,top:[]},
 pcScreen:{...s.pcScreen,mode:'off',displays,monitors:[],vdd:{checked:true,installed:false},targets:[],available:true},sharing:{on:false,mode:'mirror',remote:true,displays:[],virtual:{enabled:false,width:1920,height:1080,hiDPI:false}},displays:{list:displays,real:displays,mode:'mirror',virtual:null},screen:{on:false,displays},pcApps:{on:false,windows:[],apps:[]},apps:{list:[],windows:[],launched:[],pins:[],on:false},
 audio:{...s.audio,on:false},files:{...s.files,received:'Downloads',sending:[],incoming:[],history:[],smb:{},drag:{},clip:{},queue:[]},notifs:{...s.notifs,history:[],recent:[],apps:[],muted:[]},terminal:{...s.terminal,status:'off',server:{installed:false}},mount:{on:false,mounted:false},wake:{macs:[],on:false},
 camera:{on:false,connected:true,share:false,viewing:false,devices:[],watchers:[]},vcam:{checked:true,supported:true,installed:false,on:false},net:{transport:'ip',ble:true,blePc:true,radio:'off'},firewall:{checking:false,ok:true},hub:{...s.hub,connected:false},multi:{on:mode==='mesh'},
 about:{app:{name:'DuoDesk for Windows',version:'2.5.0',electron:'44',chrome:'',node:process.versions.node,arch:'x64',thanks:''},pc:{host:'Studio PC',os:'Windows 11',cpu:'Synthetic CPU',cores:8,memory:'16 GB',arch:'x64',kernel:'Synthetic'}},
 ...(mode==='mesh'?{peers:[{id:'mac',name:'MacBook',os:'mac',state:'connected',rtt:4},{id:'linux',name:'Linux workstation',os:'linux',state:'connected',rtt:6}],mesh:{selectedId:'mac',connectedIds:['mac','linux'],autoJoin:false},layout:{rev:1,by:'pc',cells:{pc:{x:0,y:0},mac:{x:1,y:0},linux:{x:-1,y:0}},grid:{minX:-2,maxX:2,minY:-1,maxY:1,cells:[{id:'pc',x:0,y:0},{id:'mac',x:1,y:0},{id:'linux',x:-1,y:0}]},targets:[]}}:{})};
 const name={windows:'Studio PC',mac:'Studio MacBook',linux:'Studio Linux'}[os];
 const ownOs={windows:'win',mac:'mac',linux:'linux'}[os];
 const other={id:os==='mac'?'pc':'mac',name:os==='mac'?'Studio PC':'MacBook',os:os==='mac'?'win':'mac'};
 Object.assign(state,{name,macName:name,macId:'self',device:{id:'self',name,os:ownOs},session:{...other,role:'guest',connected:true},peer:other,
  client:{...other,deviceId:other.id,rttMs:4,transport:'ip'},peerInfo:{battery:76,charging:false},remote:{allow:true,opened:true,using:false,pad:{on:false,supported:true,live:false}},
  wake:{...state.wake,peers:{}},camera:{...state.camera,on:true,connected:true,share:true,peerShares:true,devices:[{id:'mock-camera',label:'Built-in camera (demo)'}],watchers:mode==='mesh'?[{id:other.id,name:other.name,status:'live'}]:[],sending:mode==='mesh',sendLive:mode==='mesh'},
 });
 state.link={...state.link,macName:other.name,macId:other.id,os:other.os};
 state.connection={connected:true,name:other.name,rtt:4};
 state.pcScreen.extendPx=[1920,1080];
 const shareFolder={"windows": "C:\\Users\\Demo\\DuoDesk-Shared", "mac": "/Users/demo/DuoDesk-Shared", "linux": "/home/demo/DuoDesk-Shared"}[os];
 const downloads={"windows": "C:\\Users\\Demo\\Downloads", "mac": "/Users/demo/Downloads", "linux": "/home/demo/Downloads"}[os];
 state.files={...state.files,shareFolder,folder:downloads,defaultFolder:downloads,received:downloads,acceptDrops:true,reveal:true,dragEdge:true,peerDrag:true,
  current:null,batch:null,queued:0,last:null,receiving:[],recent:[{name:'Desk-notes.txt',ok:true,path:downloads+'/Desk-notes.txt',at:Date.now()-120000}],sent:[],
  incoming:{receiving:0,last:{name:'Desk-notes.txt',ok:true,text:'Saved to Downloads',at:Date.now()-120000}},
  clip:{error:'',offer:null,incoming:null,pasting:false},drag:{state:'',last:null},
  smb:{busy:'',message:'',sharing:false,peer:null,macShare:'',drive:'',mountMessage:'',wifi:false,folder:shareFolder}};
 state.smb={sharing:false,connectPc:false,folder:shareFolder,defaultFolder:shareFolder,pcOffered:false,pcShare:null,mounted:'',mountError:'',mounting:false,wifi:false,shareBusy:false,shareError:'',peer:null};

 state.about.app.name='DuoDesk for '+{windows:'Windows',mac:'macOS',linux:'Linux'}[os];
 state.about.pc={...state.about.pc,host:name,os:{windows:'Windows 11',mac:'macOS (renderer fixture)',linux:'Linux (renderer fixture)'}[os]};
 if(os==='mac'){
  state.paired=[];state.guest={hosts:[],status:{state:'connected',message:''},pairing:null};
  state.input={where:'home',message:'',tapError:null,paused:false,locked:false,map:{mine:displays,theirs:[{id:'peer-display',x:0,y:0,w:1920,h:1080,scale:1}],along:0}};
  state.displayMode='mirror';state.streamInput=true;
  state.sharing={...state.sharing,displayId:'self-display',targetId:'self-display',bitrateMbps:30,streamMaxHeight:1080,audio:false,
   displays:[{id:'self-display',label:'Studio display',width:2560,height:1440,pixelWidth:2560,pixelHeight:1440,virtual:false,primary:true}],
   virtual:{enabled:true,width:1920,height:1080,hiDPI:false,hz:60,active:false,error:null}};
  state.receive={on:false,fullScreen:false,input:true,session:null,kind:'screen',status:'off',stats:null,open:false,framegen:false,remote:{on:false,mode:'mirror',remote:true}};
  state.papps={on:true,apps:[{id:'demo-editor',name:'Text editor (demo)',icon:''}],listing:false,launch:{},windows:[]};state.apps.offer=true;
  state.terminal={...state.terminal,allowPc:false,connectPc:false,installed:false,remoteLogin:false,toPc:{ready:false,why:'waiting'}};
  state.wake.womp=false;
 }
 if(mode==='mesh'){
  state.peers=[{...other,state:'connected',connected:true,selected:true,rtt:4},{id:'lab',name:'Lab computer',os:'linux',state:'connected',connected:true,selected:false,rtt:6}];
  state.mesh={...state.mesh,selectedId:other.id,connectedIds:state.peers.map(p=>p.id)};
 }
 if(scenario==='phone'){
  const phone={id:'demo-phone',name:'Pixel demo phone',os:'android'};
  state.peer=phone;state.session={...phone,role:'guest',connected:true};state.client={...phone,deviceId:phone.id,rttMs:7,transport:'ip'};
  state.link={...state.link,state:'connected',macId:phone.id,macName:phone.name,os:'android',rtt:7};
  state.connection={connected:true,name:phone.name,rtt:7};
  state.phone={...state.phone,connected:{id:phone.id,name:phone.name,rttMs:7,usb:false},nearby:[{...phone,connected:true}],assets:1,apps:2,
   info:{battery:82,charging:false,maker:'Google',model:'Pixel 8 (demo)',release:'15',colors:['#344759','#697b84']},
   adb:{enabled:true,address:'192.0.2.20',port:37123,paired:true},
   bridge:{state:'ready',message:'',serial:'synthetic-phone',input:'adb',inputMode:'auto',canPair:false,inputBlocked:false,
    windows:[{id:1,kind:'screen',title:'Pixel demo phone',width:412,height:915}],adb:{available:true},sound:{on:true},camera:{on:false,virtual:false}},
   ctl:{can:{ring:true,lock:true,volume:true},qs:{wifi:true,bluetooth:true,data:true,torch:false,dnd:false,rotate:true},volume:{level:7,max:15},ringer:'ring'},
   top:[{id:'org.demo.notes',name:'Notes',count:4},{id:'org.demo.calendar',name:'Calendar',count:2}],
  };
  const perm=Object.fromEntries(['calls','messages','media','files'].map(k=>[k,{perm:'ok',missing:[]}]));
  state.hub={...state.hub,calls:true,messages:true,media:true,files:true,connected:true,supported:true,name:phone.name,perm,
   call:null,ended:null,unread:1,muted:false,canAudio:true,callAudio:true,audio:{state:'ready',here:false,canMove:true,devices:[{id:'demo-bt',name:phone.name}],device:'demo-bt'},share:null};
  state.notifs={...state.notifs,receive:true,history:[{id:'demo-notification',app:'org.demo.notes',appName:'Notes',title:'Desk plan',body:'Your draft is ready to review.',at:Date.now()-30000,reply:false}]};
  if(mode==='mesh'){
   state.peers=state.peers.map(p=>({...p,selected:false}));state.peers.unshift({...phone,state:'connected',connected:true,selected:true,rtt:7});
   state.mesh={...state.mesh,selectedId:phone.id,connectedIds:state.peers.map(p=>p.id)};
  }
 }
 if(scenario==='offline'){
  state.link={...state.link,state:'not_paired',macName:'',macId:'',rtt:null};state.peer=null;state.client=null;state.session=null;state.connected=false;
  state.connection={connected:false};state.phone.connected=null;state.phone.nearby=[];state.hub.connected=false;state.camera.connected=false;state.camera.watchers=[];state.camera.sending=false;
  if(mode==='mesh'){state.peers=state.peers.map(p=>({...p,state:'offline',connected:false,selected:false,rtt:null}));state.mesh={...state.mesh,selectedId:null,connectedIds:[]};}
  if(os==='mac')state.guest.status.state='not_paired';
 }
 if(mode==='mesh'){
  const cells={self:{x:0,y:0}};
  for(const peer of state.peers) cells[peer.id]=peer.os==='android'?{x:0,y:1}:peer.id===other.id?{x:1,y:0}:{x:-1,y:0};
  const layout=Layout.normalize({rev:1,by:'self',cells});
  state.layout={...layout,grid:Layout.grid(layout),targets:Object.fromEntries(Object.keys(cells).map(id=>[id,Layout.targets(layout,id).map(c=>c.x+','+c.y)])),
   reach:Layout.reach(layout,'self',id=>state.peers.some(p=>p.id===id&&p.connected),id=>state.peers.some(p=>p.id===id&&p.os==='android'))};
  state.kvm.edges=state.kvmState.edges=Layout.neighbors(layout,'self');
 }
 if(os==='linux'){state.peerSession=state.session;state.session={type:'x11',desktop:'GNOME (demo)',input:'x11',access:null,inputNote:'',helperError:''};}
 if(mode==='pair'){const {watchers,...pairCamera}=state.camera;state.camera=pairCamera;}
 return state;

}


const phoneAssets={apps:[{id:'org.demo.notes',name:'Notes',icon:''},{id:'org.demo.calendar',name:'Calendar',icon:''}],wallpaper:''};
const thumbnail='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#30404c"/><circle cx="220" cy="70" r="35" fill="#849b9e"/><path d="M0 240L100 85 210 240M120 240L230 130 320 240" fill="#566f72"/></svg>').toString('base64');
function hubResponses(request){
 const at=Date.now()-60000;
 const base={t:request.t};
 switch(request.t){
  case 'contacts':return [{...base,q:'',items:[{name:'Alex (demo)',numbers:[{n:'+12025550123',label:'Mobile'}]},{name:'Sam (demo)',numbers:[{n:'+12025550124',label:'Mobile'}]}]}];
  case 'call.log':return [{...base,items:[{name:'Alex (demo)',number:'+12025550123',type:'in',dur:182,at},{name:'Sam (demo)',number:'+12025550124',type:'missed',dur:0,at:at-3600000}]}];
  case 'sms.threads':return [{...base,items:[{id:'demo-thread',name:'Alex (demo)',addrs:['+12025550123'],snippet:'The mock desk is ready.',unread:1,at}]}];
  case 'sms.thread':return [{...base,id:request.id,before:request.before||0,more:false,items:[{id:'demo-reply',body:'Thanks, I will review it here.',out:true,at:at+30000},{id:'demo-message',body:'The mock desk is ready.',out:false,at}]}];
  case 'media.list':return [{...base,kind:request.kind||'all',before:request.before||'',more:false,items:[{id:'demo-photo',name:'Quiet-landscape-demo.svg',at,w:320,h:240,size:4096,album:'Demo pictures'}]}];
  case 'media.thumb':return (request.ids||[request.id]).map(id=>({...base,id,data:thumbnail}));
  case 'media.view':return [{...base,id:request.id,data:thumbnail}];
  case 'fs.list':return [{...base,path:request.path||'',total:128e9,free:72e9,items:[{name:'Documents',dir:true,n:3,at},{name:'Desk-notes.txt',dir:false,size:2048,at}]}];
  default:return [];
 }
}
module.exports={fixture,phoneAssets,hubResponses};
