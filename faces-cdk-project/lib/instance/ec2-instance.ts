import { Duration, Expiration } from 'aws-cdk-lib';
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
  MachineImage,
  AmazonLinuxCpuType,
  InstanceProps,
  LaunchTemplateSpotOptions,
  LaunchTemplate,
  SpotInstanceInterruption,
  SpotRequestType,
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
        cpuType: AmazonLinuxCpuType.X86_64,
      }),
      keyName: 'faces-keypair',
    })
    this.ec2SpotInstance = appEC2SpotInstance
    
  }
}

export interface SpotInstanceProps extends InstanceProps {
  /**
   * Options for Spot instances
   * @default - Use the Launch Template's default InstanceMarketOptions
   */
  readonly spotOptions?: LaunchTemplateSpotOptions

}

const launchTemplateSpotOptions: LaunchTemplateSpotOptions = {
  blockDuration: Duration.minutes(30),
  interruptionBehavior: SpotInstanceInterruption.TERMINATE,
  maxPrice: 0.005,
  requestType: SpotRequestType.ONE_TIME,
  validUntil: Expiration.after(Duration.minutes(30))
}

export class SpotInstance extends Instance {
  constructor(scope: Construct, id: string, props: SpotInstanceProps) {
    super(scope, id, props)
    
    const template = new LaunchTemplate(this, "LaunchTemplateForSpotReq", {
      spotOptions: props.spotOptions ?? {}
    })

    this.instance.launchTemplate = {
      version: template.versionNumber,
      launchTemplateId: template.launchTemplateId
    }
  }
}
