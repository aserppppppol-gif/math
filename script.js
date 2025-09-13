// Main Application Script
import { cloudStorage } from './cloud-storage.js';
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

class ExamManagementSystem {
    constructor() {
        this.currentUser = null;
        this.students = [];
        this.questions = [];
        this.exams = [];
        this.results = [];
        this.currentExam = null;
        this.currentStudent = null;
        this.examTimer = null;
        this.currentQuestionIndex = 0;
        this.examAnswers = {};
        
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            this.setupAuthStateListener();
            await this.loadAllData();
            this.updateDashboard();
            this.updateConnectionStatus();
            
            // Update connection status every 30 seconds
            setInterval(() => {
                this.updateConnectionStatus();
            }, 30000);
            
        } catch (error) {
            console.error('خطأ في تهيئة النظام:', error);
            this.showNotification('خطأ', 'حدث خطأ في تهيئة النظام', 'error');
        }
    }

    setupAuthStateListener() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                this.showUserInfo();
                this.showNotification('مرحباً', `أهلاً بك ${user.email}`, 'success');
            } else {
                this.currentUser = null;
                this.hideUserInfo();
            }
        });
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Authentication
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.showLoginModal();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('closeLoginModal')?.addEventListener('click', () => {
            this.hideLoginModal();
        });

        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Students management
        document.getElementById('addStudentBtn')?.addEventListener('click', () => {
            this.toggleStudentForm();
        });

        document.getElementById('saveStudentBtn')?.addEventListener('click', () => {
            this.saveStudent();
        });

        document.getElementById('cancelStudentBtn')?.addEventListener('click', () => {
            this.hideStudentForm();
        });

        // Questions management
        document.getElementById('addQuestionBtn')?.addEventListener('click', () => {
            this.toggleQuestionForm();
        });

        document.getElementById('saveQuestionBtn')?.addEventListener('click', () => {
            this.saveQuestion();
        });

        document.getElementById('cancelQuestionBtn')?.addEventListener('click', () => {
            this.hideQuestionForm();
        });

        // Exams management
        document.getElementById('createExamBtn')?.addEventListener('click', () => {
            this.toggleExamForm();
        });

        document.getElementById('saveExamBtn')?.addEventListener('click', () => {
            this.saveExam();
        });

        document.getElementById('cancelExamBtn')?.addEventListener('click', () => {
            this.hideExamForm();
        });

        // Exam interface
        document.getElementById('startExamBtn')?.addEventListener('click', () => {
            this.startExam();
        });

        document.getElementById('nextQuestionBtn')?.addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('prevQuestionBtn')?.addEventListener('click', () => {
            this.prevQuestion();
        });

        document.getElementById('finishExamBtn')?.addEventListener('click', () => {
            this.finishExam();
        });

        // Results export
        document.getElementById('exportResultsBtn')?.addEventListener('click', () => {
            this.exportResults();
        });

        // Modal close on outside click
        document.getElementById('loginModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') {
                this.hideLoginModal();
            }
        });
    }

    async updateConnectionStatus() {
        try {
            const stats = await cloudStorage.getStorageStats();
            const statusElement = document.getElementById('connectionStatus');
            const statusText = document.getElementById('statusText');
            const syncIndicator = document.getElementById('syncIndicator');
            
            if (stats) {
                if (stats.isOnline) {
                    statusText.textContent = 'متصل بالسحابة';
                    syncIndicator.textContent = '✓';
                    statusElement.classList.remove('bg-red-600', 'bg-yellow-600');
                    statusElement.classList.add('bg-green-600');
                } else {
                    statusText.textContent = 'غير متصل - العمل محلياً';
                    syncIndicator.textContent = '⚠️';
                    statusElement.classList.remove('bg-green-600', 'bg-yellow-600');
                    statusElement.classList.add('bg-red-600');
                }

                if (stats.pendingOperations > 0) {
                    statusText.textContent = `مزامنة ${stats.pendingOperations} عملية...`;
                    syncIndicator.textContent = '🔄';
                    statusElement.classList.remove('bg-green-600', 'bg-red-600');
                    statusElement.classList.add('bg-yellow-600');
                }

                // Update dashboard stats
                document.getElementById('connectionStatusText').textContent = stats.isOnline ? 'متصل' : 'غير متصل';
                document.getElementById('pendingOpsText').textContent = stats.pendingOperations;
                document.getElementById('localStorageText').textContent = stats.localStorageUsed;
                document.getElementById('lastSyncText').textContent = stats.lastSync;
            }

            // Show/hide status bar
            if (cloudStorage.isConnected()) {
                statusElement.style.transform = 'translateY(-100%)';
            } else {
                statusElement.style.transform = 'translateY(0)';
            }
        } catch (error) {
            console.error('خطأ في تحديث حالة الاتصال:', error);
        }
    }

    async login() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            this.showNotification('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            this.hideLoginModal();
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            this.showNotification('خطأ', 'فشل في تسجيل الدخول. تحقق من البيانات', 'error');
        }
    }

    async logout() {
        try {
            await signOut(auth);
            this.showNotification('تم', 'تم تسجيل الخروج بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
            this.showNotification('خطأ', 'حدث خطأ في تسجيل الخروج', 'error');
        }
    }

    showUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const loginBtn = document.getElementById('loginBtn');
        
        if (userInfo && userName && loginBtn) {
            userName.textContent = this.currentUser.email;
            userInfo.classList.remove('hidden');
            userInfo.classList.add('flex');
            loginBtn.classList.add('hidden');
        }
    }

    hideUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        
        if (userInfo && loginBtn) {
            userInfo.classList.add('hidden');
            userInfo.classList.remove('flex');
            loginBtn.classList.remove('hidden');
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        // Clear form
        document.getElementById('loginForm')?.reset();
    }

    switchTab(tabName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all tabs
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('tab-active');
        });

        // Show selected section
        const targetSection = document.getElementById(tabName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Add active class to clicked tab
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('tab-active');
        }

        // Load data for specific sections
        if (tabName === 'students') {
            this.loadStudents();
        } else if (tabName === 'questions') {
            this.loadQuestions();
        } else if (tabName === 'exams') {
            this.loadExams();
        } else if (tabName === 'results') {
            this.loadResults();
        } else if (tabName === 'exam-interface') {
            this.loadExamInterface();
        }
    }

    async loadAllData() {
        try {
            await Promise.all([
                this.loadStudentsData(),
                this.loadQuestionsData(),
                this.loadExamsData(),
                this.loadResultsData()
            ]);
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
        }
    }

    async loadStudentsData() {
        try {
            const data = await cloudStorage.getData('students');
            this.students = data ? Object.values(data) : [];
        } catch (error) {
            console.error('خطأ في تحميل بيانات الطلاب:', error);
            this.students = [];
        }
    }

    async loadQuestionsData() {
        try {
            const data = await cloudStorage.getData('questions');
            this.questions = data ? Object.values(data) : [];
        } catch (error) {
            console.error('خطأ في تحميل بيانات الأسئلة:', error);
            this.questions = [];
        }
    }

    async loadExamsData() {
        try {
            const data = await cloudStorage.getData('exams');
            this.exams = data ? Object.values(data) : [];
        } catch (error) {
            console.error('خطأ في تحميل بيانات الامتحانات:', error);
            this.exams = [];
        }
    }

    async loadResultsData() {
        try {
            const data = await cloudStorage.getData('results');
            this.results = data ? Object.values(data) : [];
        } catch (error) {
            console.error('خطأ في تحميل بيانات النتائج:', error);
            this.results = [];
        }
    }

    updateDashboard() {
        // Update statistics
        document.getElementById('totalStudents').textContent = this.students.length;
        document.getElementById('totalQuestions').textContent = this.questions.length;
        document.getElementById('activeExams').textContent = this.exams.filter(exam => 
            new Date(exam.startTime) <= new Date() && new Date(exam.endTime) >= new Date()
        ).length;
        
        // Calculate average score
        if (this.results.length > 0) {
            const avgScore = this.results.reduce((sum, result) => sum + result.percentage, 0) / this.results.length;
            document.getElementById('averageScore').textContent = Math.round(avgScore) + '%';
        }

        // Update recent activity
        this.updateRecentActivity();
    }

    updateRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;

        const activities = [];
        
        // Add recent results
        this.results.slice(-3).forEach(result => {
            activities.push({
                text: `${result.studentName} أكمل امتحان ${result.examTitle}`,
                time: new Date(result.completedAt).toLocaleString('ar-SA'),
                type: 'result'
            });
        });

        // Add recent exams
        this.exams.slice(-2).forEach(exam => {
            activities.push({
                text: `تم إنشاء امتحان جديد: ${exam.title}`,
                time: new Date(exam.createdAt).toLocaleString('ar-SA'),
                type: 'exam'
            });
        });

        if (activities.length === 0) {
            activityContainer.innerHTML = '<p class="text-gray-500 text-center py-4">لا توجد أنشطة حديثة</p>';
            return;
        }

        activityContainer.innerHTML = activities.map(activity => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="text-sm">${activity.text}</span>
                <span class="text-xs text-gray-500">${activity.time}</span>
            </div>
        `).join('');
    }

    // Students Management
    toggleStudentForm() {
        const form = document.getElementById('addStudentForm');
        if (form) {
            form.classList.toggle('hidden');
            if (!form.classList.contains('hidden')) {
                document.getElementById('studentName')?.focus();
            }
        }
    }

    hideStudentForm() {
        const form = document.getElementById('addStudentForm');
        if (form) {
            form.classList.add('hidden');
            this.clearStudentForm();
        }
    }

    clearStudentForm() {
        document.getElementById('studentName').value = '';
        document.getElementById('studentId').value = '';
        document.getElementById('studentEmail').value = '';
        document.getElementById('studentGrade').value = '';
    }

    async saveStudent() {
        const name = document.getElementById('studentName')?.value?.trim();
        const studentId = document.getElementById('studentId')?.value?.trim();
        const email = document.getElementById('studentEmail')?.value?.trim();
        const grade = document.getElementById('studentGrade')?.value;

        if (!name || !studentId || !email || !grade) {
            this.showNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        // Check for duplicate student ID
        if (this.students.some(student => student.studentId === studentId)) {
            this.showNotification('خطأ', 'رقم الطالب موجود مسبقاً', 'error');
            return;
        }

        const student = {
            name,
            studentId,
            email,
            grade,
            createdAt: new Date().toISOString(),
            id: Date.now().toString()
        };

        try {
            await cloudStorage.addData('students', student);
            this.students.push(student);
            this.hideStudentForm();
            this.loadStudents();
            this.updateDashboard();
            this.showNotification('نجح', 'تم إضافة الطالب بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حفظ الطالب:', error);
            this.showNotification('خطأ', 'حدث خطأ في حفظ الطالب', 'error');
        }
    }

    loadStudents() {
        const container = document.getElementById('studentsList');
        if (!container) return;

        if (this.students.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8 col-span-full">لا توجد طلاب مسجلين</p>';
            return;
        }

        container.innerHTML = this.students.map(student => `
            <div class="bg-white p-4 rounded-lg shadow-md student-card">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-lg">${student.name}</h3>
                    <span class="text-sm text-gray-500">#${student.studentId}</span>
                </div>
                <p class="text-gray-600 text-sm mb-1">📧 ${student.email}</p>
                <p class="text-gray-600 text-sm mb-3">🎓 ${student.grade}</p>
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="examSystem.editStudent('${student.id}')" class="text-blue-600 hover:text-blue-800 text-sm">تعديل</button>
                    <button onclick="examSystem.deleteStudent('${student.id}')" class="text-red-600 hover:text-red-800 text-sm">حذف</button>
                </div>
            </div>
        `).join('');
    }

    async deleteStudent(studentId) {
        if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;

        try {
            await cloudStorage.deleteData(`students/${studentId}`);
            this.students = this.students.filter(student => student.id !== studentId);
            this.loadStudents();
            this.updateDashboard();
            this.showNotification('نجح', 'تم حذف الطالب بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حذف الطالب:', error);
            this.showNotification('خطأ', 'حدث خطأ في حذف الطالب', 'error');
        }
    }

    // Questions Management
    toggleQuestionForm() {
        const form = document.getElementById('addQuestionForm');
        if (form) {
            form.classList.toggle('hidden');
            if (!form.classList.contains('hidden')) {
                document.getElementById('questionText')?.focus();
            }
        }
    }

    hideQuestionForm() {
        const form = document.getElementById('addQuestionForm');
        if (form) {
            form.classList.add('hidden');
            this.clearQuestionForm();
        }
    }

    clearQuestionForm() {
        document.getElementById('questionText').value = '';
        document.getElementById('option1').value = '';
        document.getElementById('option2').value = '';
        document.getElementById('option3').value = '';
        document.getElementById('option4').value = '';
        document.getElementById('correctAnswer').value = '';
        document.getElementById('questionDifficulty').value = '';
        document.getElementById('questionSubject').value = '';
    }

    async saveQuestion() {
        const questionText = document.getElementById('questionText')?.value?.trim();
        const option1 = document.getElementById('option1')?.value?.trim();
        const option2 = document.getElementById('option2')?.value?.trim();
        const option3 = document.getElementById('option3')?.value?.trim();
        const option4 = document.getElementById('option4')?.value?.trim();
        const correctAnswer = document.getElementById('correctAnswer')?.value;
        const difficulty = document.getElementById('questionDifficulty')?.value;
        const subject = document.getElementById('questionSubject')?.value;

        if (!questionText || !option1 || !option2 || !option3 || !option4 || !correctAnswer || !difficulty || !subject) {
            this.showNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const question = {
            text: questionText,
            options: [option1, option2, option3, option4],
            correctAnswer: parseInt(correctAnswer) - 1, // Convert to 0-based index
            difficulty,
            subject,
            createdAt: new Date().toISOString(),
            id: Date.now().toString()
        };

        try {
            await cloudStorage.addData('questions', question);
            this.questions.push(question);
            this.hideQuestionForm();
            this.loadQuestions();
            this.updateDashboard();
            this.showNotification('نجح', 'تم إضافة السؤال بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حفظ السؤال:', error);
            this.showNotification('خطأ', 'حدث خطأ في حفظ السؤال', 'error');
        }
    }

    loadQuestions() {
        const container = document.getElementById('questionsList');
        if (!container) return;

        if (this.questions.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">لا توجد أسئلة في البنك</p>';
            return;
        }

        container.innerHTML = this.questions.map((question, index) => `
            <div class="bg-white p-4 rounded-lg shadow-md question-item">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-semibold text-lg">السؤال ${index + 1}</h3>
                    <div class="flex space-x-2 space-x-reverse">
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${question.subject}</span>
                        <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">${question.difficulty}</span>
                    </div>
                </div>
                <p class="text-gray-700 mb-3">${question.text}</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    ${question.options.map((option, optIndex) => `
                        <div class="flex items-center p-2 rounded ${optIndex === question.correctAnswer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}">
                            <span class="text-sm">${optIndex + 1}. ${option}</span>
                            ${optIndex === question.correctAnswer ? '<span class="mr-auto text-green-600">✓</span>' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="examSystem.editQuestion('${question.id}')" class="text-blue-600 hover:text-blue-800 text-sm">تعديل</button>
                    <button onclick="examSystem.deleteQuestion('${question.id}')" class="text-red-600 hover:text-red-800 text-sm">حذف</button>
                </div>
            </div>
        `).join('');
    }

    async deleteQuestion(questionId) {
        if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;

        try {
            await cloudStorage.deleteData(`questions/${questionId}`);
            this.questions = this.questions.filter(question => question.id !== questionId);
            this.loadQuestions();
            this.updateDashboard();
            this.showNotification('نجح', 'تم حذف السؤال بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حذف السؤال:', error);
            this.showNotification('خطأ', 'حدث خطأ في حذف السؤال', 'error');
        }
    }

    // Exams Management
    toggleExamForm() {
        const form = document.getElementById('createExamForm');
        if (form) {
            form.classList.toggle('hidden');
            if (!form.classList.contains('hidden')) {
                document.getElementById('examTitle')?.focus();
            }
        }
    }

    hideExamForm() {
        const form = document.getElementById('createExamForm');
        if (form) {
            form.classList.add('hidden');
            this.clearExamForm();
        }
    }

    clearExamForm() {
        document.getElementById('examTitle').value = '';
        document.getElementById('examDuration').value = '';
        document.getElementById('examDescription').value = '';
        document.getElementById('examStartTime').value = '';
        document.getElementById('examEndTime').value = '';
        document.getElementById('examQuestionCount').value = '';
    }

    async saveExam() {
        const title = document.getElementById('examTitle')?.value?.trim();
        const duration = parseInt(document.getElementById('examDuration')?.value);
        const description = document.getElementById('examDescription')?.value?.trim();
        const startTime = document.getElementById('examStartTime')?.value;
        const endTime = document.getElementById('examEndTime')?.value;
        const questionCount = parseInt(document.getElementById('examQuestionCount')?.value);

        if (!title || !duration || !startTime || !endTime || !questionCount) {
            this.showNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        if (questionCount > this.questions.length) {
            this.showNotification('خطأ', `عدد الأسئلة المطلوبة (${questionCount}) أكبر من الأسئلة المتاحة (${this.questions.length})`, 'error');
            return;
        }

        if (new Date(startTime) >= new Date(endTime)) {
            this.showNotification('خطأ', 'وقت البداية يجب أن يكون قبل وقت النهاية', 'error');
            return;
        }

        // Select random questions
        const selectedQuestions = this.getRandomQuestions(questionCount);

        const exam = {
            title,
            description,
            duration,
            startTime,
            endTime,
            questionCount,
            questions: selectedQuestions,
            createdAt: new Date().toISOString(),
            id: Date.now().toString()
        };

        try {
            await cloudStorage.addData('exams', exam);
            this.exams.push(exam);
            this.hideExamForm();
            this.loadExams();
            this.updateDashboard();
            this.showNotification('نجح', 'تم إنشاء الامتحان بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حفظ الامتحان:', error);
            this.showNotification('خطأ', 'حدث خطأ في حفظ الامتحان', 'error');
        }
    }

    getRandomQuestions(count) {
        const shuffled = [...this.questions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    loadExams() {
        const container = document.getElementById('examsList');
        if (!container) return;

        if (this.exams.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">لا توجد امتحانات</p>';
            return;
        }

        container.innerHTML = this.exams.map(exam => {
            const now = new Date();
            const startTime = new Date(exam.startTime);
            const endTime = new Date(exam.endTime);
            
            let status = 'مجدول';
            let statusClass = 'bg-blue-100 text-blue-800';
            
            if (now >= startTime && now <= endTime) {
                status = 'نشط';
                statusClass = 'bg-green-100 text-green-800';
            } else if (now > endTime) {
                status = 'منتهي';
                statusClass = 'bg-gray-100 text-gray-800';
            }

            return `
                <div class="bg-white p-4 rounded-lg shadow-md">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="font-semibold text-lg">${exam.title}</h3>
                        <span class="px-2 py-1 ${statusClass} text-xs rounded">${status}</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-2">${exam.description || 'لا يوجد وصف'}</p>
                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>⏱️ المدة: ${exam.duration} دقيقة</div>
                        <div>❓ الأسئلة: ${exam.questionCount}</div>
                        <div>🕐 البداية: ${new Date(exam.startTime).toLocaleString('ar-SA')}</div>
                        <div>🕐 النهاية: ${new Date(exam.endTime).toLocaleString('ar-SA')}</div>
                    </div>
                    <div class="flex space-x-2 space-x-reverse">
                        <button onclick="examSystem.editExam('${exam.id}')" class="text-blue-600 hover:text-blue-800 text-sm">تعديل</button>
                        <button onclick="examSystem.deleteExam('${exam.id}')" class="text-red-600 hover:text-red-800 text-sm">حذف</button>
                        <button onclick="examSystem.viewExamResults('${exam.id}')" class="text-green-600 hover:text-green-800 text-sm">النتائج</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async deleteExam(examId) {
        if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;

        try {
            await cloudStorage.deleteData(`exams/${examId}`);
            this.exams = this.exams.filter(exam => exam.id !== examId);
            this.loadExams();
            this.updateDashboard();
            this.showNotification('نجح', 'تم حذف الامتحان بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حذف الامتحان:', error);
            this.showNotification('خطأ', 'حدث خطأ في حذف الامتحان', 'error');
        }
    }

    // Exam Interface
    loadExamInterface() {
        // Load exams for selection
        const examSelect = document.getElementById('selectExamForTaking');
        const studentSelect = document.getElementById('selectStudentForExam');
        
        if (examSelect) {
            examSelect.innerHTML = '<option value="">اختر امتحان</option>' +
                this.exams.map(exam => `<option value="${exam.id}">${exam.title}</option>`).join('');
        }
        
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">اختر الطالب</option>' +
                this.students.map(student => `<option value="${student.id}">${student.name}</option>`).join('');
        }
    }

    startExam() {
        const examId = document.getElementById('selectExamForTaking')?.value;
        const studentId = document.getElementById('selectStudentForExam')?.value;

        if (!examId || !studentId) {
            this.showNotification('خطأ', 'يرجى اختيار الامتحان والطالب', 'error');
            return;
        }

        this.currentExam = this.exams.find(exam => exam.id === examId);
        this.currentStudent = this.students.find(student => student.id === studentId);

        if (!this.currentExam || !this.currentStudent) {
            this.showNotification('خطأ', 'لم يتم العثور على الامتحان أو الطالب', 'error');
            return;
        }

        // Check if exam is active
        const now = new Date();
        const startTime = new Date(this.currentExam.startTime);
        const endTime = new Date(this.currentExam.endTime);

        if (now < startTime) {
            this.showNotification('خطأ', 'الامتحان لم يبدأ بعد', 'error');
            return;
        }

        if (now > endTime) {
            this.showNotification('خطأ', 'انتهى وقت الامتحان', 'error');
            return;
        }

        // Initialize exam
        this.currentQuestionIndex = 0;
        this.examAnswers = {};
        this.startExamTimer();
        this.showExamInterface();
        this.displayCurrentQuestion();
        
        this.showNotification('بدء الامتحان', `بدأ ${this.currentStudent.name} امتحان ${this.currentExam.title}`, 'success');
    }

    showExamInterface() {
        document.getElementById('examSelection')?.classList.add('hidden');
        document.getElementById('examTakingInterface')?.classList.remove('hidden');
        
        document.getElementById('currentExamTitle').textContent = this.currentExam.title;
        document.getElementById('currentStudentName').textContent = this.currentStudent.name;
    }

    startExamTimer() {
        const duration = this.currentExam.duration * 60; // Convert to seconds
        let timeLeft = duration;

        this.examTimer = setInterval(() => {
            timeLeft--;
            
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                this.finishExam();
            }
        }, 1000);
    }

    displayCurrentQuestion() {
        const question = this.currentExam.questions[this.currentQuestionIndex];
        const questionDisplay = document.getElementById('questionDisplay');
        
        if (!question || !questionDisplay) return;

        questionDisplay.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">السؤال ${this.currentQuestionIndex + 1}</h3>
                    <span class="text-sm text-gray-500">${question.subject} - ${question.difficulty}</span>
                </div>
                <p class="text-gray-800 mb-4">${question.text}</p>
                <div class="space-y-2">
                    ${question.options.map((option, index) => `
                        <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="radio" name="question_${this.currentQuestionIndex}" value="${index}" 
                                   ${this.examAnswers[this.currentQuestionIndex] === index ? 'checked' : ''}
                                   onchange="examSystem.saveAnswer(${this.currentQuestionIndex}, ${index})"
                                   class="ml-3">
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        this.updateProgress();
        this.updateNavigationButtons();
    }

    saveAnswer(questionIndex, answerIndex) {
        this.examAnswers[questionIndex] = answerIndex;
    }

    updateProgress() {
        const progress = ((this.currentQuestionIndex + 1) / this.currentExam.questions.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = 
            `${this.currentQuestionIndex + 1} من ${this.currentExam.questions.length}`;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        const finishBtn = document.getElementById('finishExamBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex === 0;
        }

        if (this.currentQuestionIndex === this.currentExam.questions.length - 1) {
            nextBtn?.classList.add('hidden');
            finishBtn?.classList.remove('hidden');
        } else {
            nextBtn?.classList.remove('hidden');
            finishBtn?.classList.add('hidden');
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentExam.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayCurrentQuestion();
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayCurrentQuestion();
        }
    }

    async finishExam() {
        if (!confirm('هل أنت متأكد من إنهاء الامتحان؟')) return;

        clearInterval(this.examTimer);

        // Calculate score
        let correctAnswers = 0;
        this.currentExam.questions.forEach((question, index) => {
            if (this.examAnswers[index] === question.correctAnswer) {
                correctAnswers++;
            }
        });

        const totalQuestions = this.currentExam.questions.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

        const result = {
            studentId: this.currentStudent.id,
            studentName: this.currentStudent.name,
            examId: this.currentExam.id,
            examTitle: this.currentExam.title,
            score: correctAnswers,
            totalQuestions,
            percentage,
            answers: this.examAnswers,
            completedAt: new Date().toISOString(),
            id: Date.now().toString()
        };

        try {
            await cloudStorage.addData('results', result);
            this.results.push(result);
            
            this.showNotification('تم الانتهاء', `تم إنهاء الامتحان. النتيجة: ${correctAnswers}/${totalQuestions} (${percentage}%)`, 'success');
            
            // Reset exam interface
            this.resetExamInterface();
            
        } catch (error) {
            console.error('خطأ في حفظ النتيجة:', error);
            this.showNotification('خطأ', 'حدث خطأ في حفظ النتيجة', 'error');
        }
    }

    resetExamInterface() {
        document.getElementById('examSelection')?.classList.remove('hidden');
        document.getElementById('examTakingInterface')?.classList.add('hidden');
        
        // Reset selections
        document.getElementById('selectExamForTaking').value = '';
        document.getElementById('selectStudentForExam').value = '';
        
        // Clear exam data
        this.currentExam = null;
        this.currentStudent = null;
        this.examAnswers = {};
        this.currentQuestionIndex = 0;
    }

    // Results Management
    loadResults() {
        this.updateResultsFilters();
        this.displayResults();
    }

    updateResultsFilters() {
        const examFilter = document.getElementById('filterExam');
        const studentFilter = document.getElementById('filterStudent');
        
        if (examFilter) {
            examFilter.innerHTML = '<option value="">جميع الامتحانات</option>' +
                this.exams.map(exam => `<option value="${exam.id}">${exam.title}</option>`).join('');
        }
        
        if (studentFilter) {
            studentFilter.innerHTML = '<option value="">جميع الطلاب</option>' +
                this.students.map(student => `<option value="${student.id}">${student.name}</option>`).join('');
        }
    }

    displayResults() {
        const tbody = document.getElementById('resultsTableBody');
        if (!tbody) return;

        if (this.results.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                        لا توجد نتائج متاحة
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.results.map(result => {
            const statusClass = result.percentage >= 60 ? 'text-green-600' : 'text-red-600';
            const statusText = result.percentage >= 60 ? 'نجح' : 'راسب';
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="border border-gray-300 px-4 py-2">${result.studentName}</td>
                    <td class="border border-gray-300 px-4 py-2">${result.examTitle}</td>
                    <td class="border border-gray-300 px-4 py-2">${result.score}/${result.totalQuestions}</td>
                    <td class="border border-gray-300 px-4 py-2">${result.percentage}%</td>
                    <td class="border border-gray-300 px-4 py-2">${new Date(result.completedAt).toLocaleString('ar-SA')}</td>
                    <td class="border border-gray-300 px-4 py-2 ${statusClass} font-semibold">${statusText}</td>
                </tr>
            `;
        }).join('');
    }

    exportResults() {
        if (this.results.length === 0) {
            this.showNotification('تنبيه', 'لا توجد نتائج للتصدير', 'warning');
            return;
        }

        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `exam_results_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification('نجح', 'تم تصدير النتائج بنجاح', 'success');
        }
    }

    generateCSV() {
        const headers = ['اسم الطالب', 'الامتحان', 'الدرجة', 'إجمالي الأسئلة', 'النسبة المئوية', 'التاريخ', 'الحالة'];
        const rows = this.results.map(result => [
            result.studentName,
            result.examTitle,
            result.score,
            result.totalQuestions,
            result.percentage + '%',
            new Date(result.completedAt).toLocaleString('ar-SA'),
            result.percentage >= 60 ? 'نجح' : 'راسب'
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Utility Methods
    showNotification(title, message, type = 'info') {
        const notification = document.getElementById('notification');
        const titleElement = document.getElementById('notificationTitle');
        const messageElement = document.getElementById('notificationMessage');
        const iconElement = document.getElementById('notificationIcon');
        
        if (!notification || !titleElement || !messageElement || !iconElement) return;

        // Set content
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Set icon and colors based on type
        const config = {
            success: { icon: '✅', class: 'border-green-500' },
            error: { icon: '❌', class: 'border-red-500' },
            warning: { icon: '⚠️', class: 'border-yellow-500' },
            info: { icon: 'ℹ️', class: 'border-blue-500' }
        };
        
        const { icon, class: borderClass } = config[type] || config.info;
        iconElement.textContent = icon;
        
        // Reset classes and add new one
        notification.className = `fixed top-4 right-4 bg-white border-l-4 ${borderClass} p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 z-50`;
        
        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Hide after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 5000);
    }

    // Placeholder methods for edit functionality
    editStudent(studentId) {
        this.showNotification('قريباً', 'ميزة التعديل ستكون متاحة قريباً', 'info');
    }

    editQuestion(questionId) {
        this.showNotification('قريباً', 'ميزة التعديل ستكون متاحة قريباً', 'info');
    }

    editExam(examId) {
        this.showNotification('قريباً', 'ميزة التعديل ستكون متاحة قريباً', 'info');
    }

    viewExamResults(examId) {
        const examResults = this.results.filter(result => result.examId === examId);
        if (examResults.length === 0) {
            this.showNotification('تنبيه', 'لا توجد نتائج لهذا الامتحان', 'warning');
            return;
        }
        
        // Switch to results tab and filter by exam
        this.switchTab('results');
        document.getElementById('filterExam').value = examId;
        this.displayResults();
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.examSystem = new ExamManagementSystem();
});

// Export for global access
window.ExamManagementSystem = ExamManagementSystem;