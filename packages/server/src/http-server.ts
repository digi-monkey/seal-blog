import { Service } from "./services/base";
import { Application } from "express";
import { logger } from "./logger";

export enum HttpProtocolMethod {
  get = "GET",
  post = "POST",
  all = "POST, GET",
  option = "OPTION",
}
export type HttpRequestCallMethod = (req: any, res: any) => any;

export enum SpecialRouterHeader {
  dynamic = "dynamic_router_",
}

export interface DynamicRouterCheckResult {
  isDynamic: boolean;
  url: string;
}

export function getMethodNames(mod: any): string[] {
  return Object.getOwnPropertyNames(mod.prototype).filter(
    (name) => name !== "constructor" && name !== "initRequest"
  );
}

export const setUrlTargetMethod = async (
  app: Application,
  target: string,
  method: HttpRequestCallMethod,
  request_type: HttpProtocolMethod = HttpProtocolMethod.get
) => {
  const url = `/${target}`;
  const executeMethod = async (
    req: any,
    res: { send: (arg0: { status: string; data?: any; error?: any }) => void }
  ) => {
    try {
      const return_data = await method(req, res);
      res.send({ status: "ok", data: return_data });
      //res.send(return_data); // just render
    } catch (error: any) {
      logger.error(`${url}, ${error.message}`);
      res.send({ status: "failed", error: error.message });
    }
  };
  switch (request_type) {
    case HttpProtocolMethod.get:
      app.get(url, async (req: any, res: any) => {
        await executeMethod(req, res);
      });
      break;

    case HttpProtocolMethod.post:
      app.post(url, async (req: any, res: any) => {
        await executeMethod(req, res);
      });
      break;

    default:
      throw new Error(`unknown request type, required ${HttpProtocolMethod}`);
  }
};

export const setUpRouters = async (
  app: Application,
  service: Service,
  mod: typeof Service
) => {
  const base_service_methods: string[] = getMethodNames(Service); //public method like ping
  const method_names: string[] =
    getMethodNames(mod).concat(base_service_methods);
  for (let name of method_names) {
    // process special router
    const target_url = name === "default" ? "" : name; // default = url "/" home page
    const { isDynamic, url } = toDynamicRouter(target_url);

    const method = async (req: any, res: any) => {
      await service.initRequest(req, res);
      if (isDynamic) {
        return (service as any)[name](req.params.arg);
      }

      return (service as any)[name]();
    };

    const httpType =
      (service as any)[name].httpProtocolMethod || HttpProtocolMethod.get;
    logger.info(`setup url => /${url}, [ ${httpType} ]`);
    switch (httpType) {
      case HttpProtocolMethod.get:
        await setUrlTargetMethod(app, url, method, HttpProtocolMethod.get);
        break;

      case HttpProtocolMethod.post:
        await setUrlTargetMethod(app, url, method, HttpProtocolMethod.post);
        break;

      default:
        throw new Error(`un-supported HttpProtocolMethod, ${httpType}`);
    }
  }
};

export const toDynamicRouter = (url: string): DynamicRouterCheckResult => {
  // dynamic_router_article to /article/:id
  if (url.startsWith(SpecialRouterHeader.dynamic)) {
    const dUrl = url.split(SpecialRouterHeader.dynamic)[1];
    return { isDynamic: true, url: `${dUrl}/:arg` };
  }
  return { isDynamic: false, url: url };
};

//#### Decorator function
export function readonly(target: any, name: any, descriptor: any) {
  descriptor.writable = false;
  return descriptor;
}

// http url method allowed: [get, post, options...]
export function allowType(value: HttpProtocolMethod = HttpProtocolMethod.get) {
  return function (target: any, name: any, _descriptor: any) {
    target[name].httpProtocolMethod = value;
  };
}
