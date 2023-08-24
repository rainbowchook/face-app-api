import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  ISecurityGroup,
  IVpc,
  Instance,
  InstanceClass,
  InstanceType,
  InstanceSize,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2'
import { Role } from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

export default class EC2SpotInstance extends Construct {
  public readonly ec2SpotInstance
  constructor(
    scope: Construct,
    id: string,
    resource: { vpc: IVpc; serverRole: Role; serverSG: ISecurityGroup }
  ) {
    super(scope, id)
    const appEC2SpotInstance = new Instance(this, 'ec2-spot-instance', {
      vpc: resource.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      role: resource.serverRole,
      securityGroup: resource.serverSG,
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE2,
        InstanceSize.MICRO
      ),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
    })
    this.ec2SpotInstance = appEC2SpotInstance
  }
}
