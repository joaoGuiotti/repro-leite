export interface FileShareService {
  /**
   * Grava temporariamente e aciona a folha de compartilhamento nativa (WhatsApp, Drive, etc).
   */
  shareFile(options: {
    filename: string;
    content: string;
    mimeType: string;
    dialogTitle: string;
  }): Promise<boolean>;

  /**
   * Abre o seletor nativo de documentos para escolher arquivo de backup (.json).
   */
  pickJsonFile(): Promise<string | null>;

  /**
   * Copia o texto para a área de transferência do dispositivo.
   */
  copyToClipboard(text: string): Promise<void>;
}
