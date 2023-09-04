import { IVpc, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'

export default class DefaultVpc extends Construct {
  public readonly vpc: IVpc
  constructor(scope: Construct, id: string) {
    super(scope, id)
    // this.vpc = new Vpc(this, 'my-vpc', {
    //   cidr: '10.0.0.1/16',
    //   natGateways: 0,
    //   subnetConfiguration: [
    //     { cidrMask: 24, name: 'public subnet', subnetType: SubnetType.PUBLIC },
    //   ],
    // })
    // /*
    this.vpc = Vpc.fromLookup(this, 'default-VPC', {
      isDefault: true,
    })
    // */
  }
}
