<template>
  <div class="consultation">
    <div class="consultation-container">
      <div v-if="!currentPatient" class="auth-section">
        <div class="auth-card">
          <h1>患者身份验证</h1>
          <p>请输入您的姓名和生日以验证身份</p>
          <a-form
            :model="authForm"
            :rules="authRules"
            @finish="verifyPatient"
            layout="vertical"
          >
            <a-form-item label="姓名" name="name">
              <a-input
                v-model:value="authForm.name"
                size="large"
                placeholder="请输入您的姓名"
              >
                <template #prefix>
                  <UserOutlined />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item label="生日" name="birthday">
              <a-date-picker
                v-model:value="authForm.birthday"
                size="large"
                format="YYYY-MM-DD"
                placeholder="请选择您的生日"
                style="width: 100%"
              />
            </a-form-item>

            <a-form-item>
              <a-button type="primary" html-type="submit" size="large" block>
                验证身份
              </a-button>
            </a-form-item>
          </a-form>

          <a-alert
            message="提示"
            description="输入任意姓名和生日即可使用。首次输入会自动创建账户,再次输入相同信息即可登录。"
            type="info"
            show-icon
          />
        </div>
      </div>

      <div v-else class="patient-portal">
        <div class="portal-header">
          <div class="patient-info">
            <UserOutlined class="patient-icon-large" />
            <div>
              <h1>{{ currentPatient.name }} 的问诊</h1>
              <p>欢迎使用在线问诊服务</p>
            </div>
          </div>
          <div class="portal-actions">
            <a-button @click="logoutPatient">
              <LogoutOutlined />
              切换用户
            </a-button>
          </div>
        </div>

        <div class="selected-doctor" v-if="selectedDoctor">
          <a-alert
            :message="`当前诊室: ${selectedDoctor.name} - ${selectedDoctor.department}`"
            type="success"
            show-icon
            closable
            @close="clearSelectedDoctor"
          />
        </div>

        <div class="questions-section">
          <a-tabs v-model:activeKey="portalActiveTab">
            <!-- Tab 1: 我的问题（原内容） -->
            <a-tab-pane key="questions" tab="我的问题">
              <div class="section-header">
                <h2>我的问题</h2>
                <a-button type="primary" @click="showSubmitModal">
                  <PlusOutlined />
                  提交问题
                </a-button>
              </div>

              <a-empty v-if="myQuestions.length === 0" description="您还没有提交过问题" />

              <div v-else class="my-questions-list">
                <a-card
                  v-for="question in myQuestions"
                  :key="question.id"
                  class="question-item"
                >
                  <template #title>
                    <div class="question-title">
                      <span>{{ question.doctorName }}</span>
                      <a-tag :color="question.status === 'answered' ? 'green' : 'orange'">
                        {{ question.status === 'answered' ? '已解答' : '待解答' }}
                      </a-tag>
                    </div>
                  </template>
                  <div class="question-detail">
                    <p class="question-text"><strong>问题:</strong> {{ question.question }}</p>
                    <p class="submit-time">提交时间: {{ formatTime(question.submitTime) }}</p>
                    <div v-if="question.status === 'answered'" class="answer-section">
                      <a-divider />
                      <p class="answer-text"><strong>医生回复:</strong> {{ question.answer }}</p>
                      <p class="answer-time">回复时间: {{ formatTime(question.answerTime!) }}</p>
                    </div>
                  </div>
                </a-card>
              </div>
            </a-tab-pane>

            <!-- Tab 2: 我的预约 (TASK-006) -->
            <a-tab-pane key="appointments" tab="我的预约">
              <a-empty v-if="myAppointments.length === 0" description="暂无预约记录" />

              <div v-else class="my-appointments-list">
                <a-card
                  v-for="appt in myAppointments"
                  :key="appt.id"
                  class="appointment-item"
                >
                  <template #title>
                    <div class="appointment-title">
                      <img v-if="getDoctorAvatar(appt.doctorId)" :src="getDoctorAvatar(appt.doctorId)" :alt="appt.doctorName" class="appt-doctor-avatar" />
                      <span>{{ appt.doctorName }}</span>
                      <a-tag color="blue">{{ appt.department }}</a-tag>
                      <a-tag :color="statusConfig[appt.status]?.color || 'default'">
                        {{ statusConfig[appt.status]?.label || appt.status }}
                      </a-tag>
                    </div>
                  </template>
                  <div class="appointment-body">
                    <div class="appointment-time">
                      <CalendarOutlined class="time-icon" />
                      <span class="time-text">{{ appt.appointmentDate }} {{ appt.timeSlotLabel }}</span>
                    </div>
                    <p class="appointment-symptoms"><strong>症状描述:</strong> {{ appt.symptoms }}</p>
                    <p class="appointment-created">创建时间: {{ formatTime(appt.createdAt) }}</p>

                    <!-- 取消原因展示 -->
                    <div v-if="appt.cancelReason" class="cancel-reason">
                      <a-alert :message="'取消原因: ' + appt.cancelReason" type="warning" show-icon :closable="false" />
                    </div>
                  </div>
                  <template #actions v-if="appt.status === 'pending' || appt.status === 'confirmed'">
                    <a-button danger size="small" @click="handleCancelAppointment(appt)">
                      取消预约
                    </a-button>
                  </template>
                </a-card>
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>
      </div>
    </div>

    <a-modal
      v-model:open="submitModalVisible"
      title="提交问题"
      @ok="submitQuestion"
      @cancel="closeSubmitModal"
      :confirmLoading="submitting"
      width="600px"
    >
      <a-form layout="vertical">
        <a-form-item label="选择医生" required>
          <a-select
            v-model:value="questionForm.doctorId"
            size="large"
            placeholder="请选择您要咨询的医生"
            :disabled="!!selectedDoctor"
          >
            <a-select-option
              v-for="doctor in availableDoctors"
              :key="doctor.id"
              :value="doctor.id"
            >
              <div class="doctor-option">
                <img :src="doctor.avatar" :alt="doctor.name" class="doctor-option-avatar" />
                <div>
                  <div>{{ doctor.name }}</div>
                  <div style="font-size: 12px; color: #999;">
                    {{ doctor.title }} · {{ doctor.department }}
                  </div>
                </div>
              </div>
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="您的问题" required>
          <a-textarea
            v-model:value="questionForm.question"
            :rows="6"
            placeholder="请详细描述您的症状或问题..."
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';
import {
  UserOutlined,
  LogoutOutlined,
  PlusOutlined,
  CalendarOutlined
} from '@ant-design/icons-vue';
import { store, Doctor, Appointment } from '../store';

const route = useRoute();

const currentPatient = computed(() => store.state.currentPatient);
const myQuestions = computed(() =>
  currentPatient.value
    ? store.getQuestionsByPatient(currentPatient.value.id)
    : []
);

const selectedDoctor = ref<Doctor | null>(null);

const authForm = reactive({
  name: '',
  birthday: null as Dayjs | null,
});

const authRules = {
  name: [{ required: true, message: '请输入姓名' }],
  birthday: [{ required: true, message: '请选择生日' }],
};

const submitModalVisible = ref(false);
const submitting = ref(false);

const questionForm = reactive({
  doctorId: '',
  question: '',
});

const availableDoctors = computed(() => {
  return selectedDoctor.value
    ? [selectedDoctor.value]
    : store.getActiveDoctors();
});

onMounted(() => {
  const doctorUsername = route.params.doctorUsername as string;
  if (doctorUsername) {
    const doctor = store.getDoctorByUsername(doctorUsername);
    if (doctor && doctor.isActive) {
      selectedDoctor.value = doctor;
      questionForm.doctorId = doctor.id;
    }
  }
});

const verifyPatient = () => {
  const birthday = authForm.birthday?.format('YYYY-MM-DD');
  if (!birthday) {
    message.error('请选择生日');
    return;
  }

  const existingPatientCount = store.state.patients.filter(
    p => p.name === authForm.name && p.birthday === birthday
  ).length;

  store.verifyPatient(authForm.name, birthday);

  if (existingPatientCount > 0) {
    message.success('验证成功,欢迎回来!');
  } else {
    message.success('首次登录,已为您创建账户!');
  }
};

const logoutPatient = () => {
  store.logoutPatient();
  selectedDoctor.value = null;
  message.success('已切换用户');
};

const clearSelectedDoctor = () => {
  selectedDoctor.value = null;
  questionForm.doctorId = '';
};

const showSubmitModal = () => {
  if (selectedDoctor.value) {
    questionForm.doctorId = selectedDoctor.value.id;
  }
  submitModalVisible.value = true;
};

const closeSubmitModal = () => {
  submitModalVisible.value = false;
  if (!selectedDoctor.value) {
    questionForm.doctorId = '';
  }
  questionForm.question = '';
};

const submitQuestion = () => {
  if (!questionForm.doctorId) {
    message.error('请选择医生');
    return;
  }

  if (!questionForm.question.trim()) {
    message.error('请输入问题');
    return;
  }

  submitting.value = true;

  setTimeout(() => {
    const doctor = store.state.doctors.find(d => d.id === questionForm.doctorId);
    if (doctor && currentPatient.value) {
      store.addQuestion({
        patientId: currentPatient.value.id,
        patientName: currentPatient.value.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        question: questionForm.question,
      });

      message.success('问题提交成功');
      closeSubmitModal();
    }

    submitting.value = false;
  }, 500);
};

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm');
};

// ==================== TASK-006: 我的预约 Tab ====================

const portalActiveTab = ref<string>('questions');

/** 监听路由 query.tab 参数，自动切换到指定 Tab */
watch(() => route.query.tab as string, (tab) => {
  if (tab === 'appointments' || tab === 'questions') {
    portalActiveTab.value = tab;
  }
}, { immediate: true });

const myAppointments = computed(() =>
  currentPatient.value
    ? store.getAppointmentsByPatient(currentPatient.value.id)
    : []
);

/** 状态 Tag 颜色映射 */
const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待确认' },
  confirmed: { color: 'green', label: '已确认' },
  completed: { color: 'blue', label: '已完成' },
  cancelled: { color: 'default', label: '已取消' },
};

/** 根据 doctorId 获取医生头像 */
const getDoctorAvatar = (doctorId: string): string => {
  const doctor = store.state.doctors.find(d => d.id === doctorId);
  return doctor?.avatar || '';
};

/** 取消预约 — 含 24h 前端预检 + Modal.confirm 二次确认 */
const handleCancelAppointment = (appt: Appointment) => {
  // 前端预检：距预约时间不足 24h 直接阻止
  const hoursDiff = dayjs(appt.appointmentDate).diff(dayjs(), 'hour', true);
  if (hoursDiff < 24) {
    message.warning('距就诊时间不足 24 小时，无法取消预约');
    return;
  }

  Modal.confirm({
    title: '确认取消预约',
    content: `确定要取消以下预约吗？\n医生：${appt.doctorName}\n日期：${appt.appointmentDate} ${appt.timeSlotLabel}\n\n取消后需重新预约。`,
    okText: '确认取消',
    okType: 'danger',
    cancelText: '再想想',
    onOk() {
      try {
        store.cancelAppointment(appt.id, appt.patientId);
        message.success('预约已成功取消');
        console.log('[CANCEL_APPOINTMENT]', {
          action: 'CANCEL_APPOINTMENT',
          appointmentId: appt.id,
          patientId: appt.patientId,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        message.error(err?.message || '操作失败，请重试');
      }
    },
  });
};
</script>

<style scoped>
.consultation {
  min-height: calc(100vh - 64px);
  padding-top: 64px;
  background: #f0f2f5;
}

.consultation-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.auth-section {
  min-height: calc(100vh - 112px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.auth-card h1 {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
}

.auth-card > p {
  font-size: 16px;
  color: #666;
  text-align: center;
  margin-bottom: 32px;
}

.patient-portal {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.portal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.patient-icon-large {
  font-size: 48px;
  color: #fff;
}

.patient-info h1 {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
}

.patient-info p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.selected-doctor {
  padding: 16px 24px;
  background: #f6ffed;
  border-bottom: 1px solid #e8e8e8;
}

.questions-section {
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.my-questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.question-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.question-detail {
  line-height: 1.6;
}

.question-text,
.answer-text {
  margin-bottom: 12px;
  color: #333;
}

.submit-time,
.answer-time {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.answer-section {
  margin-top: 16px;
}

.doctor-option {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doctor-option-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

/* ==================== TASK-006: 预约列表样式 ==================== */

.my-appointments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appointment-item {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.appointment-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.appt-doctor-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e6f4ff;
}

.appointment-body {
  line-height: 1.8;
}

.appointment-time {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.time-icon {
  font-size: 18px;
  color: #1890ff;
}

.time-text {
  letter-spacing: 0.5px;
}

.appointment-symptoms {
  margin-bottom: 4px;
  color: #333;
}

.appointment-created {
  font-size: 12px;
  color: #999;
  margin: 0 0 12px;
}

.cancel-reason {
  margin-top: 12px;
}

@media (max-width: 768px) {
  .auth-card {
    margin: 24px;
    padding: 32px 24px;
  }

  .portal-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .portal-actions {
    width: 100%;
  }
}
</style>
