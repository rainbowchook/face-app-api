import { Response } from 'express'
import { RequestWithBody } from '../server'
import { grpc } from 'clarifai-nodejs-grpc'
import service from 'clarifai-nodejs-grpc/proto/clarifai/api/service_pb'
import resources, {
  Concept,
} from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb'
import { StatusCode } from 'clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb'
import { V2Client } from 'clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb'

// const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY!
const CLARIFAI_PAT_KEY = process.env.CLARIFAI_PAT_KEY!
const CLARIFAI_USER_ID = process.env.CLARIFAI_USER_ID!
const CLARIFAI_APP_ID = process.env.CLARIFAI_APP_ID!

const WORKFLOW_ID = 'workflow-62943a'

type BoundingBox = {
  bottomRow: number
  leftCol: number
  rightCol: number
  topRow: number
}

type Sentiment = {
  name: string
  value: number
}

type BoxSentiment = { box: BoundingBox; sentiments: Sentiment[] }

const clarifai = new V2Client(
  'api.clarifai.com',
  grpc.ChannelCredentials.createSsl()
)

// This will be used by every Clarifai endpoint call
const metadata = new grpc.Metadata()
metadata.set('authorization', `Key ${CLARIFAI_PAT_KEY}`)

export const handleImageApiCall =
  () => (req: RequestWithBody, res: Response) => {
    const { imageUrl } = req.body
    console.log(imageUrl)
    if (!imageUrl) {
      return res.status(400).json('No image submitted')
    }
    const request = new service.PostWorkflowResultsRequest()
    request.setUserAppId(
      new resources.UserAppIDSet()
        .setUserId(CLARIFAI_USER_ID)
        .setAppId(CLARIFAI_APP_ID)
    )
    request.setWorkflowId(WORKFLOW_ID)
    request.setOutputConfig()
    request.addInputs(
      new resources.Input().setData(
        new resources.Data().setImage(new resources.Image().setUrl(imageUrl))
      )
    )
    clarifai.postWorkflowResults(request, metadata, (error, response) => {
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
        console.log('status: ', response.getStatus())
        if (
          response.getStatus()?.getCode() === 21200 ||
          response.getStatus()?.getDescription() === 'Model does not exist'
        ) {
          return res
            .status(500)
            .json(
              'Post workflow results failed, status: ' +
                response.getStatus()?.getDescription()
            )
        }
        return res
          .status(400)
          .json(
            'Make sure image url exists' +
              response.getStatus()?.getDescription()
          )
      }

      const results = response.getResultsList()[0]
      const output = results.getOutputsList()[2]
      const model = output.getModel()
      console.log('model: ', model?.getId())

      const regionsList = output.getData()?.getRegionsList()
      const boundingBoxes = regionsList?.map(
        (region: resources.Region): BoxSentiment => {
          const boundingBox = region.getRegionInfo()?.getBoundingBox()!
          const boundingBoxObj: BoundingBox = {
            bottomRow: boundingBox.getBottomRow(),
            leftCol: boundingBox.getLeftCol(),
            rightCol: boundingBox.getRightCol(),
            topRow: boundingBox.getTopRow(),
          }

          const conceptsList = region.getData()?.getConceptsList()!
          const sentiments = conceptsList?.map(
            (concept: resources.Concept): Sentiment => ({
              name: concept.getName(),
              value: concept.getValue(),
            })
          )
          return { box: boundingBoxObj, sentiments }
        }
      )
      // console.log(boundingBoxes)
      boundingBoxes
        ? res.json(boundingBoxes)
        : res.status(400).json('No regions detected')
    })
  }

//https://github.com/Clarifai/clarifai-nodejs-grpc/blob/master/tests/test_integration.js
