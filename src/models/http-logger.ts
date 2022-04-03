export interface RequestLogger {
  id: number;
  method: string;
  url: string;
  query: any;
  params: any;
  headers: RequestHeader;
  remoteAddress: string;
  remotePort: number;
  body: Request;
}

export interface ResponseLogger {
  statusCode: 401;
  headers: ResponseHeader;
  body: any;
}

interface ResponseHeader {
  [key: string]: string;
}
interface RequestHeader {
  [key: string]: string;
}
