import HttpClientTest from "../../utility/http-client-test";
import { expect } from "chai";
import Config from "../../../../src/lib/environment/config";

const config = Config.configFactory();
const uri: string = "/api/v1/health";

describe(`GET ${uri}`, () => {

  context(`Test server health`, () => {
    it("localhost", done => {
      HttpClientTest.call({
        method: "GET",
        uri,
        headers: {
          api_key: config.server.apiKey
        }
      }).then(response => {
        expect(response.statusCode).to.be.equal(200);
        done();
      });
    });
  });

});
