# 语音转写和自动标签测试脚本

Write-Host "=== 铜雀台 AI 语音标签测试 ===" -ForegroundColor Cyan

# 1. 登录获取 Token
Write-Host "`n[1/5] 登录管理员账号..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123456"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResp.access_token
    $headers = @{ Authorization = "Bearer $token" }
    Write-Host "✓ 登录成功" -ForegroundColor Green
} catch {
    Write-Host "✗ 登录失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 获取咨询师信息
Write-Host "`n[2/5] 获取咨询师列表..." -ForegroundColor Yellow
try {
    $consultants = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/consultants" -Headers $headers
    $consultantId = $consultants[0].id
    Write-Host "✓ 使用咨询师: $($consultants[0].name)" -ForegroundColor Green
} catch {
    Write-Host "✗ 获取咨询师失败" -ForegroundColor Red
    exit 1
}

# 3. 创建测试客户
Write-Host "`n[3/5] 创建测试客户..." -ForegroundColor Yellow
$customerBody = @{
    name = "王芳"
    phone = "13900001111"
    source = "测试客户"
} | ConvertTo-Json

try {
    $customer = Invoke-RestMethod -Uri "http://localhost:3000/api/customers" -Method POST -Headers $headers -ContentType "application/json" -Body $customerBody
    $customerId = $customer.id
    Write-Host "✓ 客户创建成功: $($customer.name)" -ForegroundColor Green
    Write-Host "  ID: $customerId" -ForegroundColor Gray
} catch {
    Write-Host "✗ 创建客户失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. 创建会话（含语音转写）
Write-Host "`n[4/5] 创建面诊会话（含语音转写）..." -ForegroundColor Yellow
$transcript = "咨询师：您好王姐，很高兴见到您！今天来是想了解哪方面的项目呢？客户：你好，我最近感觉脸上皮肤有点松弛，法令纹也越来越明显了，想了解一下抗衰项目。咨询师：太好了，我们这边抗衰项目有好几种呢，热玛吉、超声炮都有，您比较倾向哪种？客户：我朋友推荐说热玛吉不错，但听说挺疼的，我比较怕疼，这个真的有效吗？咨询师：王姐您放心，我们现在用的是舒适化无痛打法，配合表麻，90%的客户都反馈几乎感觉不到疼痛。而且热玛吉的效果是公认的，一次治疗就能维持一到两年呢。客户：那价格怎么样？大概多少钱啊？咨询师：价格方面我们会根据您的面部情况制定个性化方案，有不同的档位可以选择，到时候医生会给您详细说明。客户：好的，我回去和老公商量一下，再决定。咨询师：没问题王姐，这是我的微信，您有任何问题随时可以问我。"

$sessionBody = @{
    customerId = $customerId
    transcript = $transcript
} | ConvertTo-Json

try {
    $session = Invoke-RestMethod -Uri "http://localhost:3000/api/sessions" -Method POST -Headers $headers -ContentType "application/json" -Body $sessionBody
    Write-Host "✓ 会话创建成功" -ForegroundColor Green
    Write-Host "  会话ID: $($session.id)" -ForegroundColor Gray
    Write-Host "  状态: $($session.status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ 创建会话失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. 查看客户标签
Write-Host "`n[5/5] 查看客户自动生成的标签..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

try {
    $customerDetail = Invoke-RestMethod -Uri "http://localhost:3000/api/customers/$customerId" -Headers $headers
    
    Write-Host "`n=== 客户信息 ===" -ForegroundColor Cyan
    Write-Host "姓名: $($customerDetail.name)" -ForegroundColor White
    Write-Host "电话: $($customerDetail.phone)" -ForegroundColor White
    
    Write-Host "`n=== 自动生成的标签 ===" -ForegroundColor Cyan
    if ($customerDetail.tags -and $customerDetail.tags.Count -gt 0) {
        foreach ($tag in $customerDetail.tags) {
            Write-Host "[$($tag.category)] $($tag.value)" -ForegroundColor Green
        }
    } else {
        Write-Host "没有找到标签" -ForegroundColor Red
    }
    
    Write-Host "`n=== 应生成的标签（对比） ===" -ForegroundColor Cyan
    Write-Host "[项目意向] 热玛吉" -ForegroundColor Yellow
    Write-Host "[项目意向] 面部抗衰" -ForegroundColor Yellow
    Write-Host "[核心顾虑] 怕疼" -ForegroundColor Yellow
    Write-Host "[核心顾虑] 效果顾虑" -ForegroundColor Yellow
    Write-Host "[预算敏感度] 高敏感" -ForegroundColor Yellow
    Write-Host "[决策人] 需配偶确认" -ForegroundColor Yellow
    Write-Host "[客户来源] 朋友推荐" -ForegroundColor Yellow
    
    Write-Host "`n✓ 测试完成！" -ForegroundColor Green
    Write-Host "您可以在前端 http://localhost:5173 登录咨询师账号查看效果" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ 获取客户详情失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}