import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private bucketNameDocClients: string;
  private publicDomain: string;
  private publicDomainDocClients: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || 'hml';
    this.bucketNameDocClients = this.configService.get<string>('R2_BUCKET_NAME_DOC_CLIENTS') || 'doc_clients';
    this.publicDomain = this.configService.get<string>('R2_PUBLIC_DOMAIN') || 'https://pub-f6373861b23346918a681332b65f9a68.r2.dev';
    this.publicDomainDocClients = this.configService.get<string>('R2_PUBLIC_DOMAIN_DOC_CLIENTS') || this.publicDomain;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      console.warn('⚠️ Configuração do R2 não encontrada. Upload de imagens não estará disponível.');
      return;
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    });
  }

  /**
   * Gera URL pública permanente do R2
   */
  private generatePublicUrl(path: string): string {
    return `${this.publicDomain}/${path}`;
  }

  /**
   * Retorna o domínio público configurado
   */
  getPublicDomain(): string {
    return this.publicDomain;
  }

  /**
   * Faz upload de uma imagem para o R2
   * @param file Buffer do arquivo
   * @param path Caminho onde o arquivo será salvo (ex: "logos/cliente-123.png")
   * @param contentType Tipo MIME do arquivo (ex: "image/png")
   * @returns URL pública do arquivo
   */
  async uploadImage(
    file: Buffer,
    path: string,
    contentType: string = 'image/png',
  ): Promise<string> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('Serviço de armazenamento não configurado');
    }

    try {
      // Verificar se é uma imagem
      if (!contentType.startsWith('image/')) {
        throw new BadRequestException('O arquivo deve ser uma imagem');
      }

      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.length > 5 * 1024 * 1024) {
        throw new BadRequestException('O arquivo deve ter no máximo 5MB');
      }

      // Criar comando de upload
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: file,
        ContentType: contentType,
      });

      // Fazer upload
      await this.s3Client.send(uploadCommand);

      // Gerar URL pública permanente
      const publicUrl = this.generatePublicUrl(path);

      return publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload para R2:', error);

      // Melhorar mensagens de erro específicas
      if (error.name === 'NoSuchBucket' || error.message?.includes('Bucket')) {
        throw new InternalServerErrorException(
          'Erro de configuração do servidor de armazenamento. Entre em contato com o suporte.',
        );
      } else if (error.name === 'AccessDenied' || error.message?.includes('Access Denied')) {
        throw new InternalServerErrorException(
          'Sem permissão para fazer upload. Entre em contato com o suporte.',
        );
      } else if (
        error.name === 'NetworkError' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT'
      ) {
        throw new InternalServerErrorException(
          'Erro de conexão com o servidor. Verifique sua internet e tente novamente.',
        );
      } else if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Erro desconhecido ao fazer upload. Tente novamente.',
        );
      }
    }
  }

  /**
   * Upload de arquivo genérico (qualquer tipo) para R2/S3.
   * @param file Buffer do arquivo
   * @param path Caminho onde o arquivo será salvo
   * @param contentType Tipo MIME (ex: "application/pdf")
   * @param maxSizeBytes Tamanho máximo em bytes (default 50MB)
   * @returns URL pública do arquivo
   */
  async uploadFile(
    file: Buffer,
    path: string,
    contentType: string = 'application/octet-stream',
    maxSizeBytes: number = 50 * 1024 * 1024,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('Serviço de armazenamento não configurado');
    }
    if (file.length > maxSizeBytes) {
      throw new BadRequestException(`O arquivo deve ter no máximo ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
    }
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      Body: file,
      ContentType: contentType,
    });
    await this.s3Client.send(uploadCommand);
    return this.generatePublicUrl(path);
  }

  /**
   * Upload de arquivo para o bucket de documentos de clientes (doc_clients).
   * Usado pela API de pastas do paciente (POST .../pastas-paciente/:pastaId/arquivos).
   * @param file Buffer do arquivo
   * @param path Caminho onde o arquivo será salvo (ex: paciente-arquivos/2024/01/uuid.pdf)
   * @param contentType Tipo MIME (ex: "application/pdf")
   * @param maxSizeBytes Tamanho máximo em bytes (default 50MB)
   * @returns URL pública do arquivo (usa R2_PUBLIC_DOMAIN_DOC_CLIENTS se definido)
   */
  async uploadFileToDocClients(
    file: Buffer,
    path: string,
    contentType: string = 'application/octet-stream',
    maxSizeBytes: number = 50 * 1024 * 1024,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('Serviço de armazenamento não configurado');
    }
    if (file.length > maxSizeBytes) {
      throw new BadRequestException(`O arquivo deve ter no máximo ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
    }
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucketNameDocClients,
      Key: path,
      Body: file,
      ContentType: contentType,
    });
    await this.s3Client.send(uploadCommand);
    return `${this.publicDomainDocClients}/${path}`;
  }

  /**
   * Gera um caminho único para o arquivo
   * @param prefix Prefixo do caminho (ex: "logos", "avatars")
   * @param filename Nome original do arquivo
   * @returns Caminho completo (ex: "logos/2024/01/uuid-nome-arquivo.png")
   */
  generateFilePath(prefix: string, filename: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = randomUUID();
    const extension = filename.split('.').pop() || 'bin';
    return `${prefix}/${year}/${month}/${uuid}.${extension}`;
  }
}

