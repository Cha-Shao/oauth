# MMIXEL SSO

## 数据库

### apps

接入sso的应用

| 项           | 描述                 |
| :----------- | :------------------- |
| id           | app id               |
| secret       | 秘钥                 |
| name         | 名称                 |
| redirect_uri | 确认授权后跳转的地址 |
| link         | 官网首页地址         |
| logo         | logo                 |
| protocol     | 用户协议地址         |
| privacy      | 隐私政策地址         |

### accounts

账号信息

| 项         | 描述                             |
| :--------- | :------------------------------- |
| session    | 账号识别码，每次登录都会更新     |
| email      | 电子邮箱                         |
| username   | 用户名                           |
| password   | 密码                             |
| authorizes | 授权登录了的应用表单             |
| valid      | 是否已验证邮箱（是否启用的账号） |
| jointime   | 加入时间                         |

authorize:
- id: 授权登录应用的id
- session: 账号识别码，每次refresh都会更新

## 授权登录

### response message

- `200` OK: 正常返回
- `400` invalid: token无法解析，过期，session已更改时的返回
- `404` not found: app id 无法找到时的返回
- `500` server: 服务器内部错误的返回

### 授权登录流程

- User: 在应用使用资源的用户
- Client: 接入SSO的应用
- Oauth: MMixel SSO 后端
- Resource: MMixel SSO 存储信息的数据库

| User                                           |      | Client                                                                |      | Oauth                                          |
| :--------------------------------------------- | :--- | :-------------------------------------------------------------------- | :--- | :--------------------------------------------- |
|                                                | <<   | 是否授权登录                                                          |      |                                                |
| 是                                             | >>   |                                                                       |      |                                                |
|                                                |      | `redirect` sso.mmixel.com/auth?id=`app_id`                            | >>   |                                                |
|                                                | <<   |                                                                       |      | 对于`app_id`的授权表单                         |
| 确认授权 `POST` /auth/request `token` `app_id` |      |                                                                       | >>   |                                                |
|                                                |      |                                                                       | <<   | token有效，跳转源站/auth?token=`request_token` |
|                                                |      | `POST` api.sso.mmixel.com/auth/apply`request_token` `app_id` `secret` | >>   |                                                |
|                                                |      |                                                                       | <<   | 授权登录token `token`                          |
|                                                | <<   | 保存登录token                                                         |      |                                                |
| 保存登录token                                  |      |                                                                       |      |                                                |

### 流

App accesses user resources through token

| Client                                                |      | Oauth          |      | Resource |
| :---------------------------------------------------- | :--- | :------------- | :--- | :------- |
| 访问用户信息 /auth/info?token=`token`&secret=`secret` | >>   |                |      |          |
|                                                       |      | 有效，获得资源 | >>   |          |
|                                                       |      |                | <<   | 资源     |
|                                                       | <<   | 资源           |      |          |

### 刷新token

| Client                                |      | Oauth     |
| :------------------------------------ | :--- | :-------- |
| `POST` /auth/refresh `token` `secret` | >>   |           |
|                                       | <<   | 新的token |

### Token payload

token存储的信息

- type: `origin` `confirm` `authorize` `request` `error`
- session: 账号识别码
> 当type是authorize时session将是授权登录内的session
- id`?`: 若是授权登录，将会存储app的id
- iat | exp: 起始，过期时间
