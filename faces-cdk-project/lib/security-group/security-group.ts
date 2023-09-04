import {
  ISecurityGroup,
  IVpc,
  SecurityGroup,
  Peer,
  Port,
} from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'

export default class ServerSecurityGroup extends Construct {
  public readonly serverSG: ISecurityGroup
  constructor(scope: Construct, id: string, resources: { vpc: IVpc }) {
    super(scope, id)
    const sg = new SecurityGroup(this, 'server-sg', {
      vpc: resources.vpc,
      description:
        'Allow SSH (TCP port 22), HTTP (TCP port 80) and HTTPS (TCP port 443) in',
      allowAllOutbound: true,
    })
    sg.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      'allow SSH access from anywhere'
    )
    sg.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'allow HTTP traffic from anywhere'
    )
    sg.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'allow HTTPS traffic from anywhere'
    )
    this.serverSG = sg
  }
}
