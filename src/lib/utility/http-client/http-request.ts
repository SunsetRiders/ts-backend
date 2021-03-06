import * as RequestPromise from "request-promise";
import { IHttpRequestObject, IHttpRequestContext } from "./i-http";

/**
 * Class to to handle HTTP requests to any web service.
 */
class HttpRequest {

   private readonly context: IHttpRequestContext;
   private readonly requestPromise: RequestPromise;

  /**
   * @constructor
   * @param {IHttpRequestContext} context HTTP context
   */
  constructor(context: IHttpRequestContext) {
    this.context = context;
    this.requestPromise = RequestPromise;
  }

  /**
   * Add default metadata do request options
   * @param {Object} opts Options object
   * @return {Object} Options with default metadata
   */
  private defaultMetadata(opts: IHttpRequestObject): IHttpRequestObject {
    // X-Request-Id
    if (this.context.logger && this.context.logger.metadata && this.context.logger.metadata.xRequestId) {
      opts.headers["X-Request-Id"] = this.context.logger.metadata.xRequestId;
    }
    return opts;
  }

  /**
   * Mount options to request promise
   * @param {IHttpRequestObject} options Incomming options object
   * @return {IHttpRequestObject} Mounted options object to make the request
   */
  private mountOptions(options: IHttpRequestObject): IHttpRequestObject {
    // Default headers
    const obj =  this.defaultMetadata({
      uri: this.context.host + options.uri,
      method: ((options.method) ? options.method : "GET"),
      json: options.json,
      simple: options.simple,
      resolveWithFullResponse: options.resolveWithFullResponse,
      qs: ((options.qs) ? options.qs : undefined),
      body: ((options.body) ? options.body : undefined),
      form: ((options.form) ? options.form : undefined),
      formData: ((options.formData) ? options.formData : undefined),
      headers: ((options.headers) ? options.headers : {}),
      debug: ((typeof options.debug === "boolean") ? options.debug : false),
    });

    // Delete unused request object keys
    if (obj.qs === undefined) {
      delete obj.qs;
    }

    if (obj.form === undefined) {
      delete obj.form;
    }

    if (obj.body === undefined) {
      delete obj.body;
    }

    if (obj.formData === undefined) {
      delete obj.formData;
    }

    if (obj.debug) {
      console.log(obj);
      delete obj.debug;
    }

    return obj;
  }

  /**
   * Call the web resource
   * @param {IHttpRequestObject} options Incoming options object
   * @return {Promise<any>} Promise object
   */
  public async call(options: IHttpRequestObject): Promise<any> {
    if (!options.origin) {
      this.context.logger.warn("Missing options.origin, please fix this before sending it to production");
    }

    // Mount the options to make the request
    const opts = this.mountOptions(options);
    const request = Object.assign({ origin: options.origin }, opts);

    /**
     * We will use some Bluebird's features (.tap(), .tapCatch()),
     * to be able to do that we need to call .promise() first, as described on:
     * https://github.com/request/request-promise/blob/18c838a1ba2e201cdb263a3ec41e0e66453c9c9c/lib/rp.js#L37
     */
    return await this.requestPromise(opts)
      .promise()
      .tap(response => {
        this.context.logger.info({
          request,
          response
        });
      })
      .tapCatch(error => {
        this.context.logger.error({
          request,
          error
        });
      });
  }
}

export default HttpRequest;
