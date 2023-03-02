export interface MailType {
  // 收件人
  to: string;
  // 邮箱地址
  email: string;
  // 邮箱标题
  title: string;
  // 这是什么
  text?: string;
  // html体
  html?: string;
  // 告诉logger发送的类型
  type: string;
}
