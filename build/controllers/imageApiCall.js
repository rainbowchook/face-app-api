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
const MODEL_ID = 'face-detection';
const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY;
const clarifai = new service_grpc_pb_1.V2Client('api.clarifai.com', clarifai_nodejs_grpc_1.grpc.ChannelCredentials.createSsl());
const metadata = new clarifai_nodejs_grpc_1.grpc.Metadata();
metadata.set('authorization', `Key ${CLARIFAI_API_KEY}`);
const handleImageApiCall = () => (req, res) => {
    const { imageUrl } = req.body;
    console.log(imageUrl);
    if (!imageUrl) {
        return res.status(400).json('No image submitted');
    }
    const request = new service_pb_1.default.PostModelOutputsRequest();
    // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
    // request.setModelId('aaa03c23b3724a16a56b629203edc62c') //general detection mode
    // request.setModelId('face-sentiment-recognition')
    request.setModelId(MODEL_ID);
    request.addInputs(new resources_pb_1.default.Input().setData(new resources_pb_1.default.Data().setImage(new resources_pb_1.default.Image().setUrl(imageUrl)
    // .setUrl("https://samples.clarifai.com/dog2.jpeg")
    )));
    clarifai.postModelOutputs(request, metadata, (error, response) => {
        var _a, _b;
        if (error) {
            console.log('1: ' + error);
            return res.status(500).json(error.message);
        }
        //type guard
        if (response.getStatus() === undefined) {
            console.log('2.1: ' + error);
            return res.status(500).json('Unable to process image');
        }
        if (((_a = response.getStatus()) === null || _a === void 0 ? void 0 : _a.getCode()) !== status_code_pb_1.StatusCode.SUCCESS) {
            // throw "Error: " + response.getStatus();
            return res.status(400).json('Make sure image url exists');
            // .json('Make sure image url exists ' + response.getStatus())
        }
        //type guard - not working?
        if (response.getOutputsList()[0].getData() === undefined) {
            console.log('2.2: ' + error);
            return res.status(500).json('Unable to process the image');
        }
        console.log('Predicted concepts, with confidence values:');
        // for (const concept of response
        //   .getOutputsList()[0]
        //   .getData()
        //   .getConceptsList()) {
        //   console.log(concept.getName() + ' ' + concept.getValue())
        // }
        // res.json(response.getOutputsList()[0].getData()?.getConceptsList())
        // const boundingBox = response
        //   .getOutputsList()[0]
        //   .getData()
        //   ?.getRegionsList()[0]
        //   .getRegionInfo()
        //   ?.getBoundingBox()
        // if (boundingBox === undefined) {
        //   return res
        //     .status(500)
        //     .json('Unable to process image: Bounding box undefined')
        // }
        const regionsList = (_b = response
            .getOutputsList()[0]
            .getData()) === null || _b === void 0 ? void 0 : _b.getRegionsList();
        const boundingBoxes = regionsList === null || regionsList === void 0 ? void 0 : regionsList.map((region) => {
            var _a;
            //region.getRegionInfo()?.getBoundingBox()
            const boundingBox = (_a = region.getRegionInfo()) === null || _a === void 0 ? void 0 : _a.getBoundingBox();
            // if (boundingBox === undefined) {
            //   return res
            //     .status(500)
            //     .json('Unable to process image: Bounding box undefined')
            // }
            const boundingBoxObj = {
                bottomRow: boundingBox.getBottomRow(),
                leftCol: boundingBox.getLeftCol(),
                rightCol: boundingBox.getRightCol(),
                topRow: boundingBox.getTopRow(),
            };
            return boundingBoxObj;
        });
        console.log(boundingBoxes);
        // res.json(response.getOutputsList()[0].getData()?.getRegionsList()[0].getRegionInfo()?.getBoundingBox()?.getBottomRow())
        // res.json(response.getOutputsList()[0].getData()?.getRegionsList())
        boundingBoxes
            ? res.json(boundingBoxes)
            : res.status(400).json('No regions detected');
    });
};
exports.handleImageApiCall = handleImageApiCall;
//https://github.com/Clarifai/clarifai-nodejs-grpc/blob/master/tests/test_integration.js
