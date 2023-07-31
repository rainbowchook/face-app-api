import { Response } from 'express'
import { RequestWithBody } from '../server'
import { grpc } from 'clarifai-nodejs-grpc'
import service from 'clarifai-nodejs-grpc/proto/clarifai/api/service_pb'
import resources from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb'
import { StatusCode } from 'clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb'
import { V2Client } from 'clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb'

const MODEL_ID = 'face-detection'
const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY

type BoundingBox = {
  bottomRow: number
  leftCol: number
  rightCol: number
  topRow: number
}

const clarifai = new V2Client(
  'api.clarifai.com',
  grpc.ChannelCredentials.createSsl()
)

const metadata = new grpc.Metadata()
metadata.set('authorization', `Key ${CLARIFAI_API_KEY}`)

export const handleImageApiCall =
  () => (req: RequestWithBody, res: Response) => {
    const { imageUrl } = req.body
    console.log(imageUrl)
    if (!imageUrl) {
      return res.status(400).json('No image submitted')
    }
    const request = new service.PostModelOutputsRequest()
    // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
    // request.setModelId('aaa03c23b3724a16a56b629203edc62c') //general detection mode
    // request.setModelId('face-sentiment-recognition')
    request.setModelId(MODEL_ID)
    request.addInputs(
      new resources.Input().setData(
        new resources.Data().setImage(
          new resources.Image().setUrl(imageUrl)
          // .setUrl("https://samples.clarifai.com/dog2.jpeg")
        )
      )
    )

    clarifai.postModelOutputs(request, metadata, (error, response) => {
      if (error) {
        console.log('1: ' + error)
        return res.status(500).json(error.message)
      }
      //type guard
      if (response.getStatus() === undefined) {
        console.log('2.1: ' + error)
        return res.status(500).json('Unable to process image')
      }

      if (response.getStatus()?.getCode() !== StatusCode.SUCCESS) {
        // throw "Error: " + response.getStatus();
        return res.status(400).json('Make sure image url exists')
        // .json('Make sure image url exists ' + response.getStatus())
      }
      //type guard - not working?
      if (response.getOutputsList()[0].getData() === undefined) {
        console.log('2.2: ' + error)
        return res.status(500).json('Unable to process the image')
      }

      console.log('Predicted concepts, with confidence values:')
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

      const regionsList = response
        .getOutputsList()[0]
        .getData()
        ?.getRegionsList()
      const boundingBoxes = regionsList?.map(
        (region: resources.Region): BoundingBox => {
          //region.getRegionInfo()?.getBoundingBox()
          const boundingBox = region.getRegionInfo()?.getBoundingBox()!

          // if (boundingBox === undefined) {
          //   return res
          //     .status(500)
          //     .json('Unable to process image: Bounding box undefined')
          // }
          const boundingBoxObj: BoundingBox = {
            bottomRow: boundingBox.getBottomRow(),
            leftCol: boundingBox.getLeftCol(),
            rightCol: boundingBox.getRightCol(),
            topRow: boundingBox.getTopRow(),
          }
          return boundingBoxObj
        }
      )
      console.log(boundingBoxes)
      // res.json(response.getOutputsList()[0].getData()?.getRegionsList()[0].getRegionInfo()?.getBoundingBox()?.getBottomRow())
      // res.json(response.getOutputsList()[0].getData()?.getRegionsList())
      boundingBoxes
        ? res.json(boundingBoxes)
        : res.status(400).json('No regions detected')
    })
  }

//https://github.com/Clarifai/clarifai-nodejs-grpc/blob/master/tests/test_integration.js
