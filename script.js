// 空间数据
const spacesData = [
    {
        id: 1,
        title: "现代办公空间",
        category: "office",
        location: "北京市朝阳区",
        size: "120㎡",
        capacity: "8-12人",
        price: 15000,
        period: "月",
        description: "位于CBD核心区域，配备现代化办公设施，交通便利，适合中小型企业办公。",
        features: {
            "wifi": "高速WiFi",
            "parking": "免费停车",
            "meeting": "会议室",
            "kitchen": "茶水间"
        },
        icon: "🏢"
    },
    {
        id: 2,
        title: "创意设计工作室",
        category: "studio",
        location: "上海市徐汇区",
        size: "80㎡",
        capacity: "4-6人",
        price: 12000,
        period: "月",
        description: "充满创意的设计空间，采光良好，适合设计师和创意团队使用。",
        features: {
            "wifi": "高速WiFi",
            "design": "设计工具",
            "storage": "储物空间",
            "display": "展示区域"
        },
        icon: "🎨"
    },
    {
        id: 3,
        title: "高端会议室",
        category: "meeting",
        location: "深圳市南山区",
        size: "60㎡",
        capacity: "10-15人",
        price: 800,
        period: "小时",
        description: "配备先进会议设备的高端会议室，适合重要商务会议和客户洽谈。",
        features: {
            "projector": "投影设备",
            "audio": "音响系统",
            "video": "视频会议",
            "whiteboard": "白板"
        },
        icon: "💼"
    },
    {
        id: 4,
        title: "仓储物流空间",
        category: "warehouse",
        location: "广州市白云区",
        size: "500㎡",
        capacity: "大型货物",
        price: 25000,
        period: "月",
        description: "大型仓储空间，配备完善的物流设施，适合电商和物流企业使用。",
        features: {
            "loading": "装卸平台",
            "security": "24小时监控",
            "climate": "恒温恒湿",
            "logistics": "物流配套"
        },
        icon: "📦"
    },
    {
        id: 5,
        title: "联合办公空间",
        category: "office",
        location: "杭州市西湖区",
        size: "200㎡",
        capacity: "20-30人",
        price: 20000,
        period: "月",
        description: "开放式联合办公空间，提供灵活的工位租赁，适合创业团队和自由职业者。",
        features: {
            "wifi": "高速WiFi",
            "community": "社区活动",
            "events": "定期活动",
            "support": "创业支持"
        },
        icon: "🤝"
    },
    {
        id: 6,
        title: "摄影工作室",
        category: "studio",
        location: "成都市锦江区",
        size: "100㎡",
        capacity: "摄影团队",
        price: 1000,
        period: "小时",
        description: "专业摄影工作室，配备专业灯光设备，适合商业摄影和艺术创作。",
        features: {
            "lighting": "专业灯光",
            "backdrop": "背景布",
            "equipment": "摄影设备",
            "editing": "后期设备"
        },
        icon: "📸"
    },
    {
        id: 7,
        title: "培训教室",
        category: "meeting",
        location: "南京市鼓楼区",
        size: "150㎡",
        capacity: "30-50人",
        price: 600,
        period: "小时",
        description: "专业的培训教室，配备多媒体教学设备，适合企业培训和学术讲座。",
        features: {
            "projector": "投影设备",
            "audio": "音响系统",
            "seating": "舒适座椅",
            "aircon": "空调系统"
        },
        icon: "🎓"
    },
    {
        id: 8,
        title: "科技研发中心",
        category: "office",
        location: "武汉市东湖高新区",
        size: "300㎡",
        capacity: "15-25人",
        price: 30000,
        period: "月",
        description: "专业的科技研发空间，配备实验室设备，适合科技公司和研发团队。",
        features: {
            "lab": "实验室",
            "equipment": "研发设备",
            "network": "高速网络",
            "security": "安全系统"
        },
        icon: "🔬"
    }
];

// DOM元素
const spacesGrid = document.getElementById('spacesGrid');
const filterTabs = document.querySelectorAll('.filter-tab');
const searchTabs = document.querySelectorAll('.tab-btn');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const searchForm = document.querySelector('.search-form');
const contactForm = document.querySelector('.contact-form form');

// 当前状态
let currentFilter = 'all';
let currentSearch = '';
let currentTab = 'rent';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    renderSpaces();
    setupEventListeners();
    setupScrollAnimations();
    setupFormValidation();
});

// 渲染空间卡片
function renderSpaces() {
    const filteredSpaces = spacesData.filter(space => {
        const matchesCategory = currentFilter === 'all' || space.category === currentFilter;
        const matchesSearch = space.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
                            space.description.toLowerCase().includes(currentSearch.toLowerCase()) ||
                            space.location.toLowerCase().includes(currentSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredSpaces.length === 0) {
        spacesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 20px;"></i>
                <h3>未找到匹配的空间</h3>
                <p>请尝试其他搜索关键词或筛选条件</p>
            </div>
        `;
        return;
    }

    spacesGrid.innerHTML = filteredSpaces.map(space => `
        <div class="space-card fade-in" data-category="${space.category}">
            <div class="space-image">
                <span style="font-size: 4rem;">${space.icon}</span>
            </div>
            <div class="space-content">
                <h3 class="space-title">${space.title}</h3>
                <div class="space-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${space.location}</span>
                </div>
                <div class="space-features">
                    ${Object.entries(space.features).slice(0, 2).map(([key, value]) => `
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>${value}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="space-price">
                    <div>
                        <span class="price">¥${space.price.toLocaleString()}</span>
                        <span class="price-period">/${space.period}</span>
                    </div>
                    <a href="#" class="view-details" onclick="showSpaceDetails(${space.id})">查看详情</a>
                </div>
            </div>
        </div>
    `).join('');

    // 触发动画
    setTimeout(() => {
        document.querySelectorAll('.space-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 100);
        });
    }, 100);
}

// 设置事件监听器
function setupEventListeners() {
    // 筛选功能
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 更新按钮状态
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 更新筛选条件
            currentFilter = this.dataset.category;
            renderSpaces();
        });
    });

    // 搜索标签切换
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            searchTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentTab = this.dataset.tab;
        });
    });

    // 移动端菜单
    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // 关闭移动端菜单
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });

    // 导航栏滚动效果
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
    });

    // 搜索表单提交
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const locationInput = this.querySelector('input[type="text"]');
            currentSearch = locationInput.value;
            renderSpaces();
            
            // 滚动到空间展示区域
            document.getElementById('spaces').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }

    // 联系表单提交
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('消息发送成功！我们会尽快回复您。', 'success');
            this.reset();
        });
    }

    // 加载更多按钮
    const loadMoreBtn = document.querySelector('.load-more button');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            showNotification('正在加载更多空间...', 'info');
            // 这里可以添加加载更多数据的逻辑
        });
    }
}

// 设置滚动动画
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // 观察所有需要动画的元素
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // 统计数据动画
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumbers();
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
}

// 数字动画
function animateNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = parseInt(stat.textContent.replace(/[^\d]/g, ''));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (stat.textContent.includes('+')) {
                stat.textContent = Math.floor(current).toLocaleString() + '+';
            } else if (stat.textContent.includes('%')) {
                stat.textContent = Math.floor(current) + '%';
            } else {
                stat.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    });
}

// 显示空间详情
function showSpaceDetails(spaceId) {
    const space = spacesData.find(s => s.id === spaceId);
    if (!space) return;

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${space.title}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="modal-image">
                    <span style="font-size: 6rem;">${space.icon}</span>
                </div>
                <div class="modal-info">
                    <div class="modal-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${space.location}</span>
                    </div>
                    <div class="modal-specs">
                        <div class="spec-item">
                            <span class="spec-label">空间大小</span>
                            <span class="spec-value">${space.size}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">容纳人数</span>
                            <span class="spec-value">${space.capacity}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">价格</span>
                            <span class="spec-value">¥${space.price.toLocaleString()}/${space.period}</span>
                        </div>
                    </div>
                    <div class="modal-features">
                        <h3>设施特色</h3>
                        <div class="features-grid">
                            ${Object.entries(space.features).map(([key, value]) => `
                                <div class="feature-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>${value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-description">
                        <h3>详细介绍</h3>
                        <p>${space.description}</p>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="contactSpace(${space.id})">联系租赁</button>
                        <button class="btn-outline" onclick="addToFavorites(${space.id})">收藏</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加模态框样式
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            display: flex;
            position: fixed;
            z-index: 2000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        }
        
        .modal-content {
            background-color: white;
            margin: auto;
            padding: 0;
            border-radius: 15px;
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            border-radius: 15px 15px 0 0;
        }
        
        .modal-header h2 {
            margin: 0;
            font-size: 1.8rem;
        }
        
        .close {
            font-size: 2rem;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.3s ease;
        }
        
        .close:hover {
            color: #fbbf24;
        }
        
        .modal-body {
            padding: 30px;
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 30px;
            align-items: start;
        }
        
        .modal-image {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 15px;
        }
        
        .modal-location {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #64748b;
            margin-bottom: 20px;
            font-size: 1.1rem;
        }
        
        .modal-specs {
            margin-bottom: 25px;
        }
        
        .spec-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .spec-label {
            font-weight: 500;
            color: #64748b;
        }
        
        .spec-value {
            color: #1e293b;
            font-weight: 600;
        }
        
        .modal-features h3,
        .modal-description h3 {
            color: #1e293b;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 25px;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #475569;
        }
        
        .feature-item i {
            color: #10b981;
        }
        
        .modal-description p {
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        
        .modal-actions {
            display: flex;
            gap: 15px;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .modal-body {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .modal-content {
                width: 95%;
            }
            
            .modal-header {
                padding: 15px 20px;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-actions {
                flex-direction: column;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // 关闭模态框
    const closeModal = () => {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        }, 300);
    };

    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // 添加淡出动画
    const fadeOutStyle = document.createElement('style');
    fadeOutStyle.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(fadeOutStyle);
}

// 联系空间
function contactSpace(spaceId) {
    showNotification('正在为您联系空间提供方...', 'info');
    // 这里可以添加联系逻辑
}

// 添加到收藏
function addToFavorites(spaceId) {
    showNotification('已添加到收藏夹！', 'success');
    // 这里可以添加收藏逻辑
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // 添加通知样式
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 3000;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        }
        
        .notification-success {
            background: #10b981;
            color: white;
        }
        
        .notification-error {
            background: #ef4444;
            color: white;
        }
        
        .notification-info {
            background: #3b82f6;
            color: white;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(notification);

    // 自动移除通知
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 300);
    }, 3000);
}

// 表单验证
function setupFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    let isValid = true;
    let message = '';

    // 移除之前的错误状态
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // 验证规则
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        message = '此字段为必填项';
    } else if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            message = '请输入有效的邮箱地址';
        }
    } else if (type === 'tel' && value) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            message = '请输入有效的手机号码';
        }
    }

    if (!isValid) {
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '4px';
        field.parentNode.appendChild(errorDiv);
    }

    return isValid;
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // ESC键关闭模态框
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.querySelector('.close').click();
        }
    }
    
    // Ctrl+F 聚焦搜索框
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-form input[type="text"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    // 添加页面加载动画
    document.body.classList.add('loaded');
    
    // 预加载图片（如果有的话）
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('页面错误:', e.error);
});

// 导出函数供全局使用
window.showSpaceDetails = showSpaceDetails;
window.contactSpace = contactSpace;
window.addToFavorites = addToFavorites;