'use client';
import {createContext} from 'react';
export const OwnerUploadContext=createContext<((id:string,busy:boolean)=>void)|undefined>(undefined);
