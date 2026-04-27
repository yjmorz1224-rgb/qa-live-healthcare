<template>
  <div class="doctor-room">
    <div class="room-container" v-if="currentDoctor">
      <div class="room-header">
        <div class="doctor-info">
          <img :src="currentDoctor.avatar" :alt="currentDoctor.name" class="doctor-avatar" />
          <div>
            <h1>{{ currentDoctor.name }}的诊室</h1>
            <p>{{ currentDoctor.title }} · {{ currentDoctor.department }}</p>
          </div>
        </div>
        <div class="room-actions">
          <a-button @click="copyRoomUrl">
            <CopyOutlined />
            复制诊室链接
          </a-button>
          <a-button danger @click="logout">
            <LogoutOutlined />
            退出登录
          </a-button>
        </div>
      </div>

      <div class="room-url">
        <a-alert
          :message="`诊室URL: ${roomUrl}`"
          type="success"
          show-icon
        />
      </div>

      <div class="questions-section">
        <div class="section-header">
          <h2>待响应问题 ({{ pendingQuestions.length }})</h2>
          <a-button type="primary" @click="refreshQuestions">
            <ReloadOutlined />
            刷新
          </a-button>
        </div>

        <a-empty v-if="pendingQuestions.length === 0" description="暂无待响应问题" />

        <div v-else class="questions-list">
          <div
            v-for="question in pendingQuestions"
            :key="question.id"
            class="question-card"
          >
            <div class="question-header">
              <div class="patient-info">
                <UserOutlined class="patient-icon" />
                <span class="patient-name">{{ question.patientName }}</span>
              </div>
              <span class="submit-time">{{ formatTime(question.submitTime) }}</span>
            </div>
            <div class="question-content">
              <p>{{ question.question }}</p>
            </div>
            <div class="question-actions">
              <a-button type="primary" @click="showAnswerModal(question)">
                <EditOutlined />
                文字回复
              </a-button>
              <a-button @click="markAsAnswered(question.id)">
                <CheckOutlined />
                标记已解答
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <div class="answered-section">
        <h2>已解答问题 ({{ answeredQuestions.length }})</h2>
        <a-collapse v-if="answeredQuestions.length > 0" accordion>
          <a-collapse-panel
            v-for="question in answeredQuestions"
            :key="question.id"
            :header="`${question.patientName}: ${question.question.substring(0, 50)}...`"
          >
            <div class="answered-content">
              <p class="question-text"><strong>问题:</strong> {{ question.question }}</p>
              <p class="answer-text"><strong>回复:</strong> {{ question.answer }}</p>
              <p class="answer-time">回复时间: {{ formatTime(question.answerTime!) }}</p>
            </div>
          </a-collapse-panel>
        </a-collapse>
        <a-empty v-else description="暂无已解答问题" />
      </div>

      <!-- TASK-007: 预约管理区域 -->
      <div class="appointment-section">
        <!-- 子区域 A: 待处理预约 -->
        <div class="appt-subsection">
          <h2>待处理预约 ({{ pendingAppointments.length }})</h2>
          <a-empty v-if="pendingAppointments.length === 0" description="暂无待处理预约" />
          <div v-else class="appt-list">
            <div
              v-for="appt in pendingAppointments"
              :key="appt.id"
              class="appt-card"
            >
              <div class="appt-header">
                <span class="appt-patient-name">{{ appt.patientName }}</span>
                <span class="appt-time"><CalendarOutlined /> {{ appt.appointmentDate }} {{ appt.timeSlotLabel }}</span>
              </div>
              <p class="appt-symptoms">{{ appt.symptoms }}</p>
              <div class="appt-actions">
                <a-button type="primary" size="small" @click="handleConfirm(appt)">
                  确认预约
                </a-button>
                <a-button danger size="small" @click="handleReject(appt)">
                  拒绝
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 子区域 B: 已确认预约 (Table) -->
        <div class="appt-subsection">
          <h2>已确认预约 ({{ confirmedAppointments.length }})</h2>
          <a-empty v-if="confirmedAppointments.length === 0" description="暂无已确认预约" />
          <a-table
            v-else
            :columns="apptColumns"
            :data-source="confirmedAppointments"
            :row-key="(record: Appointment) => record.id"
            size="small"
            :pagination="{ pageSize: 5 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="handleComplete(record)">
                  完成
                </a-button>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </div>

    <a-modal
      v-model:open="answerModalVisible"
      title="回复问题"
      @ok="submitAnswer"
      @cancel="closeAnswerModal"
      :confirmLoading="submitting"
    >
      <div v-if="selectedQuestion" class="modal-content">
        <div class="question-info">
          <p><strong>患者:</strong> {{ selectedQuestion.patientName }}</p>
          <p><strong>问题:</strong> {{ selectedQuestion.question }}</p>
        </div>
        <a-form-item label="您的回复">
          <a-textarea
            v-model:value="answerText"
            :rows="6"
            placeholder="请输入您的专业建议和回复..."
          />
        </a-form-item>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  CopyOutlined,
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined,
  EditOutlined,
  CheckOutlined,
  CalendarOutlined
} from '@ant-design/icons-vue';
import { store, Question, Appointment } from '../store';

const route = useRoute();
const router = useRouter();

const username = route.params.username as string;
const currentDoctor = computed(() => store.state.currentDoctor);
const roomUrl = computed(() => `${window.location.origin}/consultation/${username}`);

const pendingQuestions = computed(() =>
  currentDoctor.value
    ? store.getQuestionsByDoctor(currentDoctor.value.id).filter(q => q.status === 'pending')
    : []
);

const answeredQuestions = computed(() =>
  currentDoctor.value
    ? store.getQuestionsByDoctor(currentDoctor.value.id).filter(q => q.status === 'answered')
    : []
);

const answerModalVisible = ref(false);
const selectedQuestion = ref<Question | null>(null);
const answerText = ref('');
const submitting = ref(false);

onMounted(() => {
  if (!currentDoctor.value || currentDoctor.value.username !== username) {
    message.error('请先登录');
    router.push('/doctor/login');
  }
});

const copyRoomUrl = () => {
  navigator.clipboard.writeText(roomUrl.value);
  message.success('诊室链接已复制到剪贴板');
};

const logout = () => {
  store.logoutDoctor();
  message.success('已退出登录');
  router.push('/');
};

const refreshQuestions = () => {
  message.success('已刷新问题列表');
};

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm');
};

const showAnswerModal = (question: Question) => {
  selectedQuestion.value = question;
  answerText.value = '';
  answerModalVisible.value = true;
};

const closeAnswerModal = () => {
  answerModalVisible.value = false;
  selectedQuestion.value = null;
  answerText.value = '';
};

const submitAnswer = () => {
  if (!answerText.value.trim()) {
    message.error('请输入回复内容');
    return;
  }

  submitting.value = true;

  setTimeout(() => {
    if (selectedQuestion.value) {
      store.answerQuestion(selectedQuestion.value.id, answerText.value);
      message.success('回复成功');
      closeAnswerModal();
    }
    submitting.value = false;
  }, 500);
};

const markAsAnswered = (questionId: string) => {
  store.markQuestionAsAnswered(questionId);
  message.success('已标记为已解答');
};

// ==================== TASK-007: 预约管理区域 ====================

const pendingAppointments = computed(() =>
  currentDoctor.value ? store.getPendingAppointments(currentDoctor.value.id) : []
);

/** confirmed 状态预约 — 用于 Table 展示 */
const confirmedAppointments = computed(() =>
  currentDoctor.value
    ? store.getAppointmentsByDoctor(currentDoctor.value.id).filter(a => a.status === 'confirmed')
    : []
);

/** 已确认预约 Table 列定义 */
const apptColumns = [
  { title: '日期', dataIndex: 'appointmentDate', key: 'appointmentDate', width: 110 },
  { title: '时段', dataIndex: 'timeSlotLabel', key: 'timeSlotLabel', width: 130 },
  { title: '患者', dataIndex: 'patientName', key: 'patientName', width: 100 },
  { title: '症状', dataIndex: 'symptoms', key: 'symptoms', ellipsis: true },
  { title: '操作', key: 'action', width: 80 },
];

/** 确认预约 */
const handleConfirm = (appt: Appointment) => {
  try {
    store.confirmAppointment(appt.id);
    message.success('预约已确认');
  } catch (_err: any) {
    message.error('操作失败，请稍后重试');
  }
};

/** 拒绝预约 — 含可选原因输入 */
const handleReject = (appt: Appointment) => {
  let reason = '';
  Modal.confirm({
    title: '拒绝预约',
    content: () => h('div', [
      h('p', '确定要拒绝以下预约吗？'),
      h('p', [h('strong', '患者: '), appt.patientName]),
      h('p', [h('strong', '时间: '), appt.appointmentDate, ' ', appt.timeSlotLabel]),
      h('div', { style: 'margin-top:12px' }, [
        h('a-textarea', {
          value: reason,
          placeholder: '拒绝原因（选填）',
          maxlength: 200,
          rows: 3,
          'onUpdate:value': (val: string) => { reason = val; },
        }),
      ]),
    ]),
    okText: '确认拒绝',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      try {
        store.rejectAppointment(appt.id, reason || undefined);
        message.success('已拒绝该预约');
      } catch (_err: any) {
        message.error('操作失败，请稍后重试');
      }
    },
  });
};

/** 完成预约 */
const handleComplete = (appt: Appointment) => {
  try {
    store.completeAppointment(appt.id);
    message.success('预约已完成');
  } catch (_err: any) {
    message.error('操作失败，请稍后重试');
  }
};
</script>

<style scoped>
.doctor-room {
  min-height: calc(100vh - 64px);
  padding-top: 64px;
  background: #f0f2f5;
}

.room-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.room-header {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.doctor-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.doctor-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.doctor-info h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.doctor-info p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.room-actions {
  display: flex;
  gap: 12px;
}

.room-url {
  margin-bottom: 24px;
}

.questions-section,
.answered-section,
.appointment-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-header h2,
.answered-section h2,
.appointment-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.patient-icon {
  font-size: 16px;
  color: #1890ff;
}

.patient-name {
  font-weight: 600;
  color: #333;
}

.submit-time {
  font-size: 12px;
  color: #999;
}

.question-content {
  margin-bottom: 12px;
}

.question-content p {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin: 0;
}

.question-actions {
  display: flex;
  gap: 12px;
}

.answered-content {
  padding: 12px 0;
}

.question-text,
.answer-text {
  margin-bottom: 12px;
  line-height: 1.6;
}

.answer-time {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.modal-content .question-info {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.modal-content .question-info p {
  margin: 8px 0;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .room-header {
    flex-direction: column;
    gap: 16px;
  }

  .room-actions {
    width: 100%;
    flex-direction: column;
  }

  .question-actions {
    flex-direction: column;
  }
}

/* ==================== TASK-007: 预约管理样式 ==================== */

.appt-subsection + .appt-subsection {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid #f0f0f0;
}

.appt-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.appt-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.appt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.appt-patient-name {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.appt-time {
  font-size: 13px;
  color: #1890ff;
  display: flex;
  align-items: center;
  gap: 4px;
}

.appt-symptoms {
  margin: 0 0 12px;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.appt-actions {
  display: flex;
  gap: 12px;
}
</style>
