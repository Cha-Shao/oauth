# MMIXEL SSO

## 数据库

### apps

接入sso的应用

| 项           | 描述                 |
| :----------- | :------------------- |
| app_id       | id                   |
| secret       | 秘钥                 |
| name         | 名称                 |
| redirect_uri | 确认授权后跳转的地址 |
| logo         | logo                 |
| protocol     | 用户协议地址         |
| privacy      | 隐私政策地址         |

### accounts

账号信息

| 项        | 描述                             |
| :-------- | :------------------------------- |
| session   | 账号识别码，每次登录都会更新     |
| email     | 电子邮箱                         |
| username  | 用户名                           |
| password  | 密码                             |
| authorize | 授权登录了的应用表单             |
| valid     | 是否已验证邮箱（是否启用的账号） |
| jointime  | 加入时间                         |

authorize:
- app_id: 授权登录应用的id
- session: 账号识别码，每次重新授权登录都会更新


## 授权登录

| User                                           |      | Client                                              |      | Oauth                                          |      | Resource |
| :--------------------------------------------- | :--- | :-------------------------------------------------- | :--- | :--------------------------------------------- | :--- | :------- |
|                                                | <<   | 是否授权登录                                        |      |                                                |      |          |
| 是                                             | >>   |                                                     |      |                                                |      |          |
|                                                |      | 跳转`GET` /auth?app_id=`app_id`                     | >>   |                                                |      |          |
|                                                | <<   |                                                     |      | 对于`app_id`的授权表单                         |      |          |
| 确认授权 `POST` /auth/request `token` `app_id` |      |                                                     | >>   |                                                |      |          |
|                                                |      |                                                     | <<   | token有效，跳转源站/auth?token=`request_token` |      |          |
|                                                |      | `POST` /auth/token`request_token` `app_id` `secret` | >>   |                                                |      |          |
|                                                |      |                                                     | <<   | 授权登录token `token`                          |      |          |
|                                                |      | 保存登录token                                       |      |                                                |      |          |

## 流

App accesses user resources through token

| User |      | Client                 |      | Oauth          |      | Resource |
| :--- | :--- | :--------------------- | :--- | :------------- | :--- | :------- |
|      |      | 通过token 访问用户信息 | >>   |                |      |          |
|      |      |                        |      | 有效，获得资源 | >>   |          |
|      |      |                        |      |                | <<   | 资源     |
|      |      |                        | <<   | 资源           |      |          |

## 刷新token

| User |      | Client                                         |      | Oauth     |      | Resource |
| :--- | :--- | :--------------------------------------------- | :--- | :-------- | :--- | :------- |
|      |      | `POST` /auth/refresh `token` `app_id` `secret` | >>   |           |      |          |
|      |      |                                                | <<   | 新的token |      |          |

## Token payload

token存储的信息

- type: `origin` `confirm` `authorize` `error`
- session: 账号识别码
- app_id`?`: 若是授权登录，将会存储app的id
- iat | exp: 起始，过期时间
