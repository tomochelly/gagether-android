export type VisitorProvider='google'|'discord';
export type VisitorIdentity={subject:string;name:string;email:string};
export type VisitorUser={name:string;email:string;provider:VisitorProvider};
