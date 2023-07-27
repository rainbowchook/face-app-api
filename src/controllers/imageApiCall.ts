import { Response } from "express"
import { RequestWithBody } from "../server"
import { grpc } from "clarifai-nodejs-grpc"
import service from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb"
import resources from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb"
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb"
import { V2Client } from "clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb"



const clarifai = new V2Client("api.clarifai.com", grpc.ChannelCredentials.createSsl());

const metadata = new grpc.Metadata();
metadata.set("authorization", `Key ${process.env.CLARIFAI_API_KEY}`);

export const handleImageApiCall = () => (req: RequestWithBody, res: Response) => {
  const { imageUrl } = req.body
  if(!imageUrl) {
    return res.status(400).json('No image submitted')
  }
  const request = new service.PostModelOutputsRequest();
  // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
  request.setModelId("aaa03c23b3724a16a56b629203edc62c");
  request.addInputs(
    new resources.Input()
      .setData(
        new resources.Data()
          .setImage(
            new resources.Image()
            .setUrl(imageUrl)  
            // .setUrl("https://samples.clarifai.com/dog2.jpeg")
          )
      )
  )
  
  clarifai.postModelOutputs(
      request,
      metadata,
      (error, response) => {
          if (error) {
            console.log('here')
              throw error;
          }

          if(response.getStatus() === undefined || response.getStatus() === undefined) {
            throw error;
          }
  
          if (response.getStatus().getCode() !== StatusCode.SUCCESS) {
              throw "Error: " + response.getStatus();
          }
  
          console.log("Predicted concepts, with confidence values:")
          for (const concept of response.getOutputsList()[0].getData().getConceptsList()) {
              console.log(concept.getName() + " " + concept.getValue());
          }
          res.json(response.getOutputsList()[0].getData()?.getConceptsList())
      }
  )
}

//https://github.com/Clarifai/clarifai-nodejs-grpc/blob/master/tests/test_integration.js