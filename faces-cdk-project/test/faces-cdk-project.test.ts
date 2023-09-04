import { App, Stack } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as FacesCdkProject from '../lib/faces-cdk-project-stack'
import { SpotInstance } from '../lib/instance/ec2-instance'
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SpotInstanceInterruption,
  SpotRequestType,
  Vpc,
  MachineImage,
} from 'aws-cdk-lib/aws-ec2'

// example test. To run these tests, uncomment this file along with the
// example resource in lib/faces-cdk-project-stack.ts

const instanceProp = (stack: Stack) => ({
  vpc: new Vpc(stack, 'Vpc', {}),
  instanceType: InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MICRO),
  machineImage: MachineImage.latestAmazonLinux2(),
})

test('SpotInstanceProps with SpotRequestType.ONE_TIME', () => {
  const app = new App()
  //     // WHEN
  const stack = new FacesCdkProject.FacesCdkProjectStack(app, 'MyTestStack')

  new SpotInstance(stack, 'Test', {
    ...instanceProp(stack),
    spotOptions: {
      requestType: SpotRequestType.ONE_TIME,
      interruptionBehavior: SpotInstanceInterruption.TERMINATE,
    },
  })
  //     // THEN
  const template = Template.fromStack(stack)
  expect(template).toMatchSnapshot()
  //   template.hasResourceProperties('AWS::SQS::Queue', {
  //     VisibilityTimeout: 300
  //   });
})
