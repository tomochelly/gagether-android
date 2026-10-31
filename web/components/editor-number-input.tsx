'use client';
import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';
/** Keep partial input such as "1" while the owner is typing a valid size "18". */
export default function EditorNumberInput({value,onValueChange,min,max,allowEmpty=true,...props}:{value?:number;onValueChange:(n:number|undefined)=>void;min:number;max:number;allowEmpty?:boolean}&Omit<InputHTMLAttributes<HTMLInputElement>,'type'|'value'|'onChange'|'min'|'max'>){
 const [text,setText]=useState(value===undefined?'':String(value)),focused=useRef(false);
 useEffect(()=>{if(!focused.current)setText(value===undefined?'':String(value))},[value]);
 return <input {...props} type="number" min={min} max={max} value={text} onFocus={e=>{focused.current=true;props.onFocus?.(e)}} onChange={e=>{const v=e.target.value;setText(v);if(v===''){if(allowEmpty)onValueChange(undefined);return}const n=Number(v);if(Number.isFinite(n)&&n>=min&&n<=max)onValueChange(n)}} onBlur={e=>{focused.current=false;const n=Number(text);if(text===''&&allowEmpty)onValueChange(undefined);else if(text!==''&&Number.isFinite(n)&&n>=min&&n<=max)onValueChange(n);else setText(value===undefined?'':String(value));props.onBlur?.(e)}}/>;
}
