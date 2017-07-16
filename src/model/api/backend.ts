
import { Base } from '../base/base';
import { Forum } from '../forum/forum';
import { AdvertisementToolInterface } from '../advertisement-tool/advertisement-tool-interface';
import { ERROR } from '../error/error';

export class BackendApi extends Base {



    constructor(public root, private req, private res) {

        super();

    }



    /**
     * 
     * @warning @attention When you are going to call BackendApi::run(), you cannot use 'async' or 'Promise' since it uses callback.
     * @warning @attention BackendApi::run() will be triggered by web browser and the result will be sent back to browser using 'Express::resopnse'
     * 
     */
    run() {

        // console.log(res);



        let base = new Base();
        let f = base.checkRequest(this.req);
        if (f.error) {
            return this.res.send({ code: f.error });
        }

        let params = this.req.body;

        // console.log( f );
        let taxonomy = null;
        if (f.className == 'forum') taxonomy = new Forum();
        else if (f.className == 'adv') taxonomy = new AdvertisementToolInterface();
        else return this.res.send({ code: base.makeErrorString(ERROR.wrong_route_class, params['route']) });


        // console.log("param: ", params, f);
        if (taxonomy[f.methodName] === void 0) return this.res.send({ code: this.makeErrorString(ERROR.api_route_not_exsit, f.methodName) });
        if (typeof taxonomy[f.methodName] !== 'function') return this.res.send({ code: ERROR.api_route_exist_as_a_property_but_not_a_function });




        taxonomy.setRoot(this.root);


        this.getSecretKey(params.uid)
            .then(key => {                                  /// secret key check for security.
                if (key === params['secret']) {
                    // console.log("key: ", key);
                    return key;
                } else {
                    throw new Error(ERROR.secret_does_not_match);
                }
            })
            .then(key => {
                return taxonomy[f.methodName](params);
            })
            .then(x => {
                return this.res.send({ code: 0, data: x });
            })
            .catch(e => {
                this.res.send({ code: e.message });
            });

    }


}