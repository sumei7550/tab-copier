import type {Metadata} from 'next';
import RecoveryAdmin from './panel';
import './style.css';
export const metadata:Metadata={title:'恢复购买管理 · Tab Copier',robots:{index:false,follow:false}};
export default function Page(){return <RecoveryAdmin/>;}
