<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import DocumentAcknowledgementModal from "./DocumentAcknowledgementModal.vue";
import UiKitIcon from "../ui/UiKitIcon.vue";
import UiKitModal from "../ui/UiKitModal.vue";
import UiKitTag from "../ui/UiKitTag.vue";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const MAIN_RENDER_WIDTH = 900;
const THUMBNAIL_RENDER_WIDTH = 134;

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  document: {
    type: Object,
    default: null,
  },
  employeeName: {
    type: String,
    default: "ФИО",
  },
});

const emit = defineEmits(["update:modelValue", "acknowledge"]);

const pageCount = ref(0);
const selectedPage = ref(1);
const zoom = ref("100");
const isLoading = ref(false);
const loadError = ref("");
const isUnsupported = ref(false);
const hasReadDocument = ref(false);
const viewerRef = ref(null);
const pageElements = ref({});
const mainCanvases = ref({});
const thumbnailCanvases = ref({});
const isProgrammaticScroll = ref(false);
const isAcknowledgementModalOpen = ref(false);
const acknowledgedAt = ref("");

let pdfDocument = null;
let renderToken = 0;
let scrollSettleTimer = null;

const documentDetails = computed(() => ({
  title: props.document?.title || "Название документа",
  publishedAt: props.document?.publishedAt || "дд.мм.гггг чч:мм",
  readUntil: props.document?.readUntil || "дд.мм.гггг чч:мм",
  responsible: props.document?.responsible || "ФИО ответственного",
  statusLabel: props.document?.statusLabel || "Новый",
  statusVariant: props.document?.statusVariant || "new",
}));

const documentSource = computed(() =>
  (props.document?.filePath || "").replace(/^https?:\/\/[^/]+/i, ""),
);

const fileExtension = computed(() => {
  const source = (props.document?.fileName || props.document?.filePath || "").split(/[?#]/)[0];
  const dotIndex = source.lastIndexOf(".");

  return dotIndex >= 0 ? source.slice(dotIndex + 1).toLowerCase() : "";
});

const isPdfDocument = computed(
  () => Boolean(documentSource.value) && fileExtension.value === "pdf",
);

const pages = computed(() => Array.from({ length: pageCount.value }, (_, index) => index + 1));
const totalPages = computed(() => pageCount.value || 1);
const currentPageLabel = computed(() => `Стр. ${selectedPage.value}/${totalPages.value}`);
const zoomScale = computed(() => Number(zoom.value) / 100);

const isAlreadyAcknowledged = computed(
  () => props.document?.status === "success" || props.document?.statusVariant === "success",
);

const viewerMessage = computed(() => {
  if (isLoading.value) {
    return "Загрузка документа…";
  }

  if (loadError.value) {
    return loadError.value;
  }

  if (isUnsupported.value) {
    return "Предпросмотр для этого формата документа недоступен.";
  }

  return "";
});

function setPageElement(element, page) {
  if (element) {
    pageElements.value[page] = element;
  }
}

function setMainCanvas(element, page) {
  if (element) {
    mainCanvases.value[page] = element;
  }
}

function setThumbnailCanvas(element, page) {
  if (element) {
    thumbnailCanvases.value[page] = element;
  }
}

function resetViewerState() {
  selectedPage.value = 1;
  zoom.value = "100";
  hasReadDocument.value = false;
  loadError.value = "";
  isUnsupported.value = false;
  pageCount.value = 0;
  pageElements.value = {};
  mainCanvases.value = {};
  thumbnailCanvases.value = {};
  isAcknowledgementModalOpen.value = false;
  acknowledgedAt.value = "";
}

function destroyDocument() {
  if (pdfDocument) {
    pdfDocument.destroy();
    pdfDocument = null;
  }
}

async function renderPage(pdf, pageNumber, token) {
  const page = await pdf.getPage(pageNumber);

  if (token !== renderToken) {
    return;
  }

  const mainCanvas = mainCanvases.value[pageNumber];

  if (!mainCanvas) {
    return;
  }

  const baseViewport = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: MAIN_RENDER_WIDTH / baseViewport.width });

  mainCanvas.width = viewport.width;
  mainCanvas.height = viewport.height;
  await page.render({ canvas: mainCanvas, viewport }).promise;

  if (token !== renderToken) {
    return;
  }

  const thumbnailCanvas = thumbnailCanvases.value[pageNumber];

  if (thumbnailCanvas) {
    thumbnailCanvas.width = THUMBNAIL_RENDER_WIDTH;
    thumbnailCanvas.height = Math.round(
      THUMBNAIL_RENDER_WIDTH * (mainCanvas.height / mainCanvas.width),
    );
    thumbnailCanvas
      .getContext("2d")
      .drawImage(mainCanvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
  }
}

async function loadDocument() {
  const token = ++renderToken;

  destroyDocument();
  resetViewerState();

  if (!props.document) {
    return;
  }

  if (!isPdfDocument.value) {
    isUnsupported.value = true;
    hasReadDocument.value = true;
    return;
  }

  isLoading.value = true;

  try {
    const pdf = await pdfjsLib.getDocument({ url: documentSource.value }).promise;

    if (token !== renderToken) {
      pdf.destroy();
      return;
    }

    pdfDocument = pdf;
    pageCount.value = pdf.numPages;
    await nextTick();

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (token !== renderToken) {
        return;
      }

      await renderPage(pdf, pageNumber, token);
    }

    await nextTick();

    if (token === renderToken) {
      updateReadProgress();
    }
  } catch {
    if (token === renderToken) {
      loadError.value = "Не удалось загрузить документ.";
      hasReadDocument.value = true;
    }
  } finally {
    if (token === renderToken) {
      isLoading.value = false;
    }
  }
}

function updateReadProgress() {
  const viewer = viewerRef.value;

  if (!viewer) {
    return;
  }

  if (viewer.scrollTop + viewer.clientHeight >= viewer.scrollHeight - 8) {
    hasReadDocument.value = true;
  }

  const viewerTop = viewer.getBoundingClientRect().top;
  let closestPage = selectedPage.value;
  let closestDistance = Number.POSITIVE_INFINITY;

  pages.value.forEach((page) => {
    const pageElement = pageElements.value[page];

    if (!pageElement) {
      return;
    }

    const distance = Math.abs(pageElement.getBoundingClientRect().top - viewerTop - 20);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestPage = page;
    }
  });

  if (!isProgrammaticScroll.value) {
    selectedPage.value = closestPage;
  }
}

function selectPage(page) {
  selectedPage.value = page;
  isProgrammaticScroll.value = true;
  pageElements.value[page]?.scrollIntoView({ block: "start", behavior: "smooth" });

  window.clearTimeout(scrollSettleTimer);
  scrollSettleTimer = window.setTimeout(() => {
    selectedPage.value = page;
    isProgrammaticScroll.value = false;
    updateReadProgress();
  }, 650);
}

function acknowledgeDocument() {
  if (isAlreadyAcknowledged.value || !hasReadDocument.value || !props.document) {
    return;
  }

  acknowledgedAt.value = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date())
    .replace(",", "");
  isAcknowledgementModalOpen.value = true;
}

function confirmAcknowledgement() {
  if (!props.document) {
    return;
  }

  emit("acknowledge", props.document);
  isAcknowledgementModalOpen.value = false;
  emit("update:modelValue", false);
}

watch(
  () => [props.modelValue, props.document?.id],
  ([isOpen]) => {
    if (!isOpen) {
      renderToken += 1;
      destroyDocument();
      return;
    }

    loadDocument();
  },
);

watch(zoomScale, () => {
  nextTick(() => {
    if (viewerRef.value) {
      viewerRef.value.scrollLeft = 0;
    }

    updateReadProgress();
  });
});

onBeforeUnmount(() => {
  window.clearTimeout(scrollSettleTimer);
  destroyDocument();
});
</script>

<template>
  <UiKitModal
    :model-value="modelValue"
    title="Просмотр документа"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <section class="document-preview" @contextmenu.prevent @dragstart.prevent>
      <div class="document-preview__viewer">
        <aside class="document-preview__pages-list" aria-label="Страницы документа">
          <button
            v-for="page in pages"
            :key="page"
            class="document-preview__thumbnail"
            :class="{ 'document-preview__thumbnail--selected': page === selectedPage }"
            type="button"
            @click="selectPage(page)"
          >
            <span class="document-preview__thumbnail-paper" aria-hidden="true">
              <canvas
                :ref="(element) => setThumbnailCanvas(element, page)"
                class="document-preview__thumbnail-canvas"
              ></canvas>
            </span>
            <span class="document-preview__thumbnail-label">Стр. {{ page }}</span>
          </button>
        </aside>

        <div class="document-preview__main">
          <div class="document-preview__controls">
            <div class="document-preview__page-field">{{ currentPageLabel }}</div>

            <label class="document-preview__zoom">
              <select v-model="zoom" class="document-preview__zoom-select" aria-label="Масштаб документа">
                <option value="75">75%</option>
                <option value="100">100%</option>
                <option value="125">125%</option>
              </select>
              <UiKitIcon class="document-preview__zoom-icon" name="chevron-down" :size="20" />
            </label>
          </div>

          <div
            ref="viewerRef"
            class="document-preview__pages"
            :class="{ 'document-preview__pages--zoomed': zoomScale > 1 }"
            :style="{ '--document-page-scale': zoomScale }"
            @scroll="updateReadProgress"
          >
            <p v-if="viewerMessage" class="document-preview__viewer-message">
              {{ viewerMessage }}
            </p>

            <article
              v-for="page in pages"
              :key="page"
              :ref="(element) => setPageElement(element, page)"
              class="document-preview__paper"
              aria-label="Страница документа"
            >
              <canvas
                :ref="(element) => setMainCanvas(element, page)"
                class="document-preview__page-canvas"
              ></canvas>
            </article>
          </div>
        </div>
      </div>

      <aside class="document-preview__details">
        <h3 class="document-preview__details-title">Детали</h3>

        <div class="document-preview__details-content">
          <dl class="document-preview__details-list">
            <div class="document-preview__detail">
              <dt class="document-preview__detail-label">
                <span>Название</span>
                <span>:</span>
              </dt>
              <dd class="document-preview__detail-value">{{ documentDetails.title }}</dd>
            </div>

            <div class="document-preview__detail">
              <dt class="document-preview__detail-label">
                <span>Дата публикации</span>
                <span>:</span>
              </dt>
              <dd class="document-preview__detail-value">{{ documentDetails.publishedAt }}</dd>
            </div>

            <div class="document-preview__detail">
              <dt class="document-preview__detail-label">
                <span>Срок ознакомления</span>
                <span>:</span>
              </dt>
              <dd class="document-preview__detail-value">{{ documentDetails.readUntil }}</dd>
            </div>

            <div class="document-preview__detail">
              <dt class="document-preview__detail-label">
                <span>Ответственный</span>
                <span>:</span>
              </dt>
              <dd class="document-preview__detail-value">{{ documentDetails.responsible }}</dd>
            </div>

            <div class="document-preview__detail">
              <dt class="document-preview__detail-label">
                <span>Статус документа</span>
                <span>:</span>
              </dt>
              <dd class="document-preview__detail-value">
                <UiKitTag :variant="documentDetails.statusVariant" :label="documentDetails.statusLabel" />
              </dd>
            </div>
          </dl>

          <button
            class="document-preview__acknowledge"
            type="button"
            :disabled="isAlreadyAcknowledged || !hasReadDocument"
            @click="acknowledgeDocument"
          >
            {{ isAlreadyAcknowledged ? "Ознакомлено" : "Ознакомлен(а)" }}
          </button>
        </div>
      </aside>
    </section>

    <DocumentAcknowledgementModal
      v-model="isAcknowledgementModalOpen"
      :employee-name="employeeName"
      :document-title="documentDetails.title"
      :acknowledged-at="acknowledgedAt"
      @confirm="confirmAcknowledgement"
    />
  </UiKitModal>
</template>

<style scoped>
.document-preview {
  display: grid;
  grid-template-columns: minmax(0, 603px) 337px;
  gap: 30px;
  height: 100%;
  padding: 0 26px;
  overflow: hidden;
  background: var(--color-surface);
}

.document-preview__viewer {
  display: grid;
  grid-template-columns: 93px minmax(0, 480px);
  gap: 30px;
  min-width: 0;
  min-height: 0;
}

.document-preview__pages-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  padding: 20px 10px 0 0;
  overflow-x: hidden;
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
  scrollbar-width: none;
}

.document-preview__pages-list::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.document-preview__thumbnail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  width: 83px;
  flex: 0 0 auto;
  padding: 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.document-preview__thumbnail--selected {
  background: var(--color-secondary);
  color: var(--color-primary);
}

.document-preview__thumbnail-paper {
  display: block;
  width: 67px;
  min-height: 95px;
  overflow: hidden;
  border: 1px solid #dce0e5;
  border-radius: 2px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(36, 36, 36, 0.15);
  pointer-events: none;
  user-select: none;
}

.document-preview__thumbnail-canvas {
  display: block;
  width: 100%;
  height: auto;
}

.document-preview__thumbnail-label {
  color: currentColor;
  font-family: var(--font-family-base);
  font-size: 10px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.2px;
}

.document-preview__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  min-height: 0;
  padding-top: 20px;
}

.document-preview__controls {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.document-preview__page-field,
.document-preview__zoom {
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.document-preview__page-field {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 87px;
  padding: 10px 16px;
  font-family: var(--font-family-caption);
}

.document-preview__zoom {
  position: relative;
  display: block;
  width: 94px;
  font-family: var(--font-family-base);
}

.document-preview__zoom-select {
  width: 100%;
  height: 100%;
  padding: 9px 40px 9px 15px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-strong);
  appearance: none;
  outline: none;
  cursor: pointer;
}

.document-preview__zoom-icon {
  position: absolute;
  top: 50%;
  right: 15px;
  color: var(--color-text-strong);
  pointer-events: none;
  transform: translateY(-50%);
}

.document-preview__pages {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 2px 10px 20px 0;
  scrollbar-color: var(--color-text-muted) var(--color-border);
  scrollbar-width: auto;
}

.document-preview__pages--zoomed {
  align-items: flex-start;
  padding-left: 20px;
}

.document-preview__pages::-webkit-scrollbar {
  width: 10px;
}

.document-preview__pages::-webkit-scrollbar-thumb {
  background: var(--color-text-muted);
}

.document-preview__pages::-webkit-scrollbar-track {
  background: var(--color-border);
}

.document-preview__viewer-message {
  margin: auto;
  padding: 24px;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
  text-align: center;
}

.document-preview__paper {
  flex: none;
  width: calc(450px * var(--document-page-scale, 1));
  overflow: hidden;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 0 10px rgba(36, 36, 36, 0.2);
  user-select: none;
}

.document-preview__page-canvas {
  display: block;
  width: 100%;
  height: auto;
}

.document-preview__details {
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-width: 0;
  padding-top: 20px;
}

.document-preview__details-title {
  width: 100%;
  margin: 0;
  color: #121212;
  font-family: var(--font-family-base);
  font-size: 18px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.36px;
}

.document-preview__details-content,
.document-preview__details-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.document-preview__details-content {
  gap: 20px;
}

.document-preview__details-list {
  gap: 14px;
  margin: 0;
}

.document-preview__detail {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  color: var(--color-text-muted);
  font-family: var(--font-family-caption);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.document-preview__detail-label {
  display: flex;
  justify-content: space-between;
  flex: 0 0 174px;
  margin: 0;
}

.document-preview__detail-value {
  min-width: 0;
  margin: 0;
  color: var(--color-black);
}

.document-preview__acknowledge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 220px;
  min-height: 45px;
  padding: 15px 45px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.24px;
  text-transform: uppercase;
  cursor: pointer;
}

.document-preview__acknowledge:disabled {
  background: var(--color-secondary);
  cursor: not-allowed;
}

@media (max-width: 1060px) {
  .document-preview {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .document-preview__viewer {
    min-height: 640px;
  }

  .document-preview__details {
    padding-bottom: 26px;
  }
}

@media (max-width: 767px) {
  .document-preview {
    gap: 22px;
    padding: 0 18px;
  }

  .document-preview__viewer {
    grid-template-columns: 1fr;
    gap: 16px;
    min-height: 0;
  }

  .document-preview__pages-list {
    flex-direction: row;
    padding: 14px 0;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .document-preview__thumbnail {
    flex: 0 0 83px;
  }

  .document-preview__main {
    min-height: 560px;
    padding-top: 0;
  }

  .document-preview__pages {
    padding-right: 4px;
  }

  .document-preview__details {
    padding-top: 0;
  }

  .document-preview__detail {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .document-preview__detail-label {
    flex-basis: auto;
    width: 100%;
  }
}
</style>
