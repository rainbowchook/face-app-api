"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImageApiCall = void 0;
const clarifai_nodejs_grpc_1 = require("clarifai-nodejs-grpc");
const service_pb_1 = __importDefault(require("clarifai-nodejs-grpc/proto/clarifai/api/service_pb"));
const resources_pb_1 = __importDefault(require("clarifai-nodejs-grpc/proto/clarifai/api/resources_pb"));
const status_code_pb_1 = require("clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb");
const service_grpc_pb_1 = require("clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb");
// const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY!
const CLARIFAI_PAT_KEY = process.env.CLARIFAI_PAT_KEY;
const CLARIFAI_USER_ID = process.env.CLARIFAI_USER_ID;
const CLARIFAI_APP_ID = process.env.CLARIFAI_APP_ID;
const WORKFLOW_ID = 'workflow-62943a';
const clarifai = new service_grpc_pb_1.V2Client('api.clarifai.com', clarifai_nodejs_grpc_1.grpc.ChannelCredentials.createSsl());
// This will be used by every Clarifai endpoint call
const metadata = new clarifai_nodejs_grpc_1.grpc.Metadata();
metadata.set('authorization', `Key ${CLARIFAI_PAT_KEY}`);
const handleImageApiCall = () => (req, res) => {
    const { imageUrl } = req.body;
    console.log('imageUrl:', imageUrl);
    if (!imageUrl) {
        return res.status(400).json('No image submitted');
    }
    const request = new service_pb_1.default.PostWorkflowResultsRequest();
    request.setUserAppId(new resources_pb_1.default.UserAppIDSet()
        .setUserId(CLARIFAI_USER_ID)
        .setAppId(CLARIFAI_APP_ID));
    request.setWorkflowId(WORKFLOW_ID);
    request.setOutputConfig();
    request.addInputs(new resources_pb_1.default.Input().setData(new resources_pb_1.default.Data().setImage(new resources_pb_1.default.Image().setUrl(imageUrl))));
    clarifai.postWorkflowResults(request, metadata, (error, response) => {
        var _a, _b, _c, _d, _e, _f;
        if (error) {
            console.error(error);
            return res.status(500).json(error.message);
        }
        //type guard
        if (response.getStatus() === undefined) {
            console.error(error);
            return res.status(500).json('Unable to process image');
        }
        if (((_a = response.getStatus()) === null || _a === void 0 ? void 0 : _a.getCode()) !== status_code_pb_1.StatusCode.SUCCESS) {
            console.log('Response status: ', response.getStatus());
            if (((_b = response.getStatus()) === null || _b === void 0 ? void 0 : _b.getCode()) === 21200 ||
                ((_c = response.getStatus()) === null || _c === void 0 ? void 0 : _c.getDescription()) === 'Model does not exist') {
                return res
                    .status(500)
                    .json('Post workflow results failed, status: ' +
                    ((_d = response.getStatus()) === null || _d === void 0 ? void 0 : _d.getDescription()));
            }
            return res
                .status(400)
                .json('Make sure image url exists' +
                ((_e = response.getStatus()) === null || _e === void 0 ? void 0 : _e.getDescription()));
        }
        const results = response.getResultsList()[0];
        const output = results.getOutputsList()[2];
        const model = output.getModel();
        console.log('model: ', model === null || model === void 0 ? void 0 : model.getId());
        const regionsList = (_f = output.getData()) === null || _f === void 0 ? void 0 : _f.getRegionsList();
        const boundingBoxes = regionsList === null || regionsList === void 0 ? void 0 : regionsList.map((region) => {
            var _a, _b;
            const boundingBox = (_a = region.getRegionInfo()) === null || _a === void 0 ? void 0 : _a.getBoundingBox();
            const boundingBoxObj = {
                bottomRow: boundingBox.getBottomRow(),
                leftCol: boundingBox.getLeftCol(),
                rightCol: boundingBox.getRightCol(),
                topRow: boundingBox.getTopRow(),
            };
            const conceptsList = (_b = region.getData()) === null || _b === void 0 ? void 0 : _b.getConceptsList();
            const sentiments = conceptsList === null || conceptsList === void 0 ? void 0 : conceptsList.map((concept) => ({
                name: concept.getName(),
                value: concept.getValue(),
            }));
            return { box: boundingBoxObj, sentiments };
        });
        boundingBoxes
            ? res.json(boundingBoxes)
            : res.status(400).json('No regions detected');
    });
};
exports.handleImageApiCall = handleImageApiCall;
//https://github.com/Clarifai/clarifai-nodejs-grpc/blob/master/tests/test_integration.js
