// Runs offline; outputs only a salted password hash for the server environment.
import {hashAdminPassword} from '../src/lib/admin-security.ts';
async function password(prompt){
  if(!process.stdin.isTTY)throw Error('请在本机交互终端运行，密码不会显示或写入命令历史。');
  process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');process.stdin.resume();
  return new Promise((resolve,reject)=>{
    let value='';
    const finish=()=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');};
    const onData=chunk=>{for(const ch of chunk){
      if(ch==='\u0003'){finish();reject(Error('已取消'));return;}
      if(ch==='\r'||ch==='\n'){finish();resolve(value);return;}
      if(ch==='\u007f'||ch==='\b'){value=value.slice(0,-1);continue;}
      if(ch>=' '&&value.length<129)value+=ch;
    }};
    process.stdin.on('data',onData);
  });
}
try{
  const first=await password('设置管理员密码（16–128 字符，输入隐藏）：');
  const second=await password('再次输入：');
  if(first!==second)throw Error('两次密码不一致');
  const hash=hashAdminPassword(first);
  process.stdout.write('在 Vercel 新增 Secret：ADMIN_PASSWORD_HASH，值为下面整行（然后重新部署）：\n'+hash+'\n');
}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
