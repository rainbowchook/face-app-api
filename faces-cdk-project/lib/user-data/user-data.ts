import { UserData } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export type S3ServerUrl = {
  [key: string]: string
}

export default class ServerUserData extends Construct {
  public readonly serverUserData;
  constructor(scope: Construct, id: string, props?: S3ServerUrl) {
    super(scope, id)
    const userData = UserData.forLinux().addCommands()
    this.serverUserData =  userData
  }
}