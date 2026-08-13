# Estratégias de Backup de Embeddings

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir estratégias e implementações de backup de embeddings para recuperação de dados

## Visão geral

Backup de embeddings é crítico para sistemas de RAG que dependem de vetores para recuperação de contexto. Perder embeddings pode significar perda de conhecimento e capacidade de recuperação. Diferentes estratégias oferecem trade-offs entre tempo de backup, tamanho de armazenamento e facilidade de restauração.

## Estratégias de backup

### 1. Full Backup (Backup completo)

**Princípio:** Backup completo de todos os embeddings e metadados

**Características:**
- Restauração mais rápida
- Maior uso de armazenamento
- Backup mais lento
- Adequado para bancos pequenos (<1M embeddings)

**Implementação com pgvector:**
```python
import psycopg2
from datetime import datetime
import gzip
import json

def backup_pgvector_full(db_config, backup_path):
    """Backup completo de tabela pgvector"""
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()
    
    # Criar backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"{backup_path}/pgvector_full_{timestamp}.sql.gz"
    
    # Usar pg_dump para backup
    import subprocess
    cmd = f"pg_dump -h {db_config['host']} -U {db_config['user']} -d {db_config['dbname']} -t embeddings -F c -f {backup_file}"
    subprocess.run(cmd, shell=True, check=True)
    
    cursor.close()
    conn.close()
    
    return backup_file

def restore_pgvector_full(db_config, backup_file):
    """Restaurar backup completo"""
    import subprocess
    cmd = f"pg_restore -h {db_config['host']} -U {db_config['user']} -d {db_config['dbname']} {backup_file}"
    subprocess.run(cmd, shell=True, check=True)
```

**Implementação com Qdrant:**
```python
from qdrant_client import QdrantClient
import json
import gzip
from datetime import datetime

def backup_qdrant_full(qdrant_client, collection_name, backup_path):
    """Backup completo de coleção Qdrant"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"{backup_path}/qdrant_full_{collection_name}_{timestamp}.json.gz"
    
    # Recuperar todos os pontos
    points = []
    offset = None
    limit = 1000
    
    while True:
        result = qdrant_client.scroll(
            collection_name=collection_name,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=True
        )
        
        points.extend(result[0])
        
        if len(result[0]) < limit:
            break
        
        offset = result[1]
    
    # Salvar em arquivo comprimido
    with gzip.open(backup_file, 'wt', encoding='utf-8') as f:
        json.dump(points, f)
    
    return backup_file

def restore_qdrant_full(qdrant_client, collection_name, backup_file):
    """Restaurar backup completo"""
    # Carregar pontos
    with gzip.open(backup_file, 'rt', encoding='utf-8') as f:
        points = json.load(f)
    
    # Recriar coleção
    qdrant_client.recreate_collection(
        collection_name=collection_name,
        vectors_config=qdrant_client.get_collection(collection_name).config.params.vectors
    )
    
    # Inserir pontos em batches
    batch_size = 1000
    for i in range(0, len(points), batch_size):
        batch = points[i:i+batch_size]
        qdrant_client.upsert(
            collection_name=collection_name,
            points=batch
        )
```

### 2. Incremental Backup (Backup incremental)

**Princípio:** Backup apenas de embeddings alterados desde o último backup

**Características:**
- Backup mais rápido
- Menor uso de armazenamento
- Restauração mais complexa
- Adequado para bancos grandes (>1M embeddings)

**Implementação com pgvector:**
```python
import psycopg2
from datetime import datetime, timedelta

def backup_pgvector_incremental(db_config, backup_path, last_backup_time=None):
    """Backup incremental de pgvector"""
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"{backup_path}/pgvector_incremental_{timestamp}.sql.gz"
    
    # Se não há último backup, usar 24h atrás
    if last_backup_time is None:
        last_backup_time = datetime.now() - timedelta(days=1)
    
    # Backup apenas de registros alterados
    query = """
    COPY (
        SELECT * FROM embeddings 
        WHERE updated_at > %s
    ) TO STDOUT WITH CSV HEADER
    """
    
    cursor.execute(query, (last_backup_time,))
    
    # Salvar em arquivo
    with open(backup_file, 'wb') as f:
        cursor.copy_expert(query, f)
    
    cursor.close()
    conn.close()
    
    return backup_file
```

**Implementação com Qdrant:**
```python
from qdrant_client import QdrantClient
import json
import gzip
from datetime import datetime

def backup_qdrant_incremental(qdrant_client, collection_name, backup_path, last_backup_time=None):
    """Backup incremental de Qdrant"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"{backup_path}/qdrant_incremental_{collection_name}_{timestamp}.json.gz"
    
    # Se não há último backup, usar 24h atrás
    if last_backup_time is None:
        last_backup_time = datetime.now() - timedelta(days=1)
    
    # Filtrar por timestamp (requer payload com timestamp)
    filter = {
        "must": [
            {
                "key": "updated_at",
                "range": {
                    "gt": last_backup_time.timestamp()
                }
            }
        ]
    }
    
    # Recuperar pontos filtrados
    points = []
    offset = None
    limit = 1000
    
    while True:
        result = qdrant_client.scroll(
            collection_name=collection_name,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=True,
            query_filter=filter
        )
        
        points.extend(result[0])
        
        if len(result[0]) < limit:
            break
        
        offset = result[1]
    
    # Salvar em arquivo comprimido
    with gzip.open(backup_file, 'wt', encoding='utf-8') as f:
        json.dump(points, f)
    
    return backup_file
```

### 3. Snapshot Backup (Snapshot instantâneo)

**Princípio:** Snapshot do estado do banco de dados em um ponto no tempo

**Características:**
- Backup instantâneo
- Restauração rápida
- Requer suporte do banco
- Adequado para bancos com suporte nativo

**Implementação com Qdrant (snapshot nativo):**
```python
from qdrant_client import QdrantClient

def backup_qdrant_snapshot(qdrant_client, collection_name):
    """Criar snapshot nativo do Qdrant"""
    snapshot_info = qdrant_client.create_snapshot(
        collection_name=collection_name
    )
    return snapshot_info

def restore_qdrant_snapshot(qdrant_client, collection_name, snapshot_name):
    """Restaurar snapshot nativo do Qdrant"""
    qdrant_client.recover_snapshot(
        collection_name=collection_name,
        snapshot_name=snapshot_name,
        location="local"  # ou "s3", "gcs"
    )
```

**Implementação com PostgreSQL (pg_dump snapshot):**
```python
import subprocess

def backup_postgres_snapshot(db_config, backup_path):
    """Criar snapshot do PostgreSQL"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"{backup_path}/postgres_snapshot_{timestamp}.sql.gz"
    
    cmd = f"pg_dump -h {db_config['host']} -U {db_config['user']} -d {db_config['dbname']} -F c -f {backup_file}"
    subprocess.run(cmd, shell=True, check=True)
    
    return backup_file
```

### 4. Differential Backup (Backup diferencial)

**Princípio:** Backup de todas as alterações desde o último backup completo

**Características:**
- Backup mais rápido que full
- Restauração mais simples que incremental
- Uso de armazenamento moderado
- Adequado para bancos médios (100k-1M embeddings)

**Implementação:**
```python
import psycopg2
from datetime import datetime

def backup_pgvector_differential(db_config, backup_path, last_full_backup_time):
    """Backup diferencial de pgvector"""
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"{backup_path}/pgvector_differential_{timestamp}.sql.gz"
    
    # Backup de registros alterados desde o último backup completo
    query = """
    COPY (
        SELECT * FROM embeddings 
        WHERE updated_at > %s
    ) TO STDOUT WITH CSV HEADER
    """
    
    cursor.execute(query, (last_full_backup_time,))
    
    # Salvar em arquivo
    with open(backup_file, 'wb') as f:
        cursor.copy_expert(query, f)
    
    cursor.close()
    conn.close()
    
    return backup_file
```

## Estratégias de armazenamento

### 1. Local Storage

**Princípio:** Armazenar backups em disco local

**Características:**
- Acesso rápido
- Baixo custo
- Risco de perda local
- Adequado para desenvolvimento

**Implementação:**
```python
import os
import shutil

def backup_to_local(embeddings, backup_path):
    """Backup para armazenamento local"""
    os.makedirs(backup_path, exist_ok=True)
    
    # Copiar arquivo de embeddings
    shutil.copy2(embeddings, backup_path)
    
    # Comprimir
    import gzip
    with open(embeddings, 'rb') as f_in:
        with gzip.open(f"{backup_path}/embeddings.gz", 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
```

### 2. Cloud Storage (S3, GCS, Azure Blob)

**Princípio:** Armazenar backups em cloud storage

**Características:**
- Alta disponibilidade
- Durabilidade garantida
- Custo por uso
- Adequado para produção

**Implementação com S3:**
```python
import boto3
from datetime import datetime

def backup_to_s3(embeddings, bucket_name, prefix="backups"):
    """Backup para S3"""
    s3 = boto3.client('s3')
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    key = f"{prefix}/embeddings_{timestamp}.gz"
    
    # Comprimir e upload
    import gzip
    with open(embeddings, 'rb') as f_in:
        with gzip.open('/tmp/temp.gz', 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    
    s3.upload_file('/tmp/temp.gz', bucket_name, key)
    
    return f"s3://{bucket_name}/{key}"
```

**Implementação com GCS:**
```python
from google.cloud import storage
from datetime import datetime

def backup_to_gcs(embeddings, bucket_name, prefix="backups"):
    """Backup para Google Cloud Storage"""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    blob_name = f"{prefix}/embeddings_{timestamp}.gz"
    
    blob = bucket.blob(blob_name)
    
    # Comprimir e upload
    import gzip
    with open(embeddings, 'rb') as f_in:
        with gzip.open('/tmp/temp.gz', 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    
    blob.upload_from_filename('/tmp/temp.gz')
    
    return f"gs://{bucket_name}/{blob_name}"
```

### 3. Hybrid Storage (Local + Cloud)

**Princípio:** Armazenar backups localmente e na cloud

**Características:**
- Acesso rápido local
- Redundância na cloud
- Custo moderado
- Adequado para produção

**Implementação:**
```python
def backup_hybrid(embeddings, local_path, s3_bucket):
    """Backup híbrido (local + S3)"""
    # Backup local
    local_backup = backup_to_local(embeddings, local_path)
    
    # Backup cloud
    cloud_backup = backup_to_s3(embeddings, s3_bucket)
    
    return {
        'local': local_backup,
        'cloud': cloud_backup
    }
```

## Estratégias de compressão

### 1. Gzip Compression

**Princípio:** Compressão com gzip

**Características:**
- Compressão moderada (2-3x)
- Compressão rápida
- Amplamente suportado
- Adequado para uso geral

**Implementação:**
```python
import gzip

def compress_with_gzip(input_file, output_file):
    """Comprimir arquivo com gzip"""
    with open(input_file, 'rb') as f_in:
        with gzip.open(output_file, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
```

### 2. LZMA Compression

**Princípio:** Compressão com LZMA (xz)

**Características:**
- Compressão alta (3-5x)
- Compressão lenta
- Menor suporte
- Adequado para armazenamento de longo prazo

**Implementação:**
```python
import lzma

def compress_with_lzma(input_file, output_file):
    """Comprimir arquivo com LZMA"""
    with open(input_file, 'rb') as f_in:
        with lzma.open(output_file, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
```

### 3. Zstandard Compression

**Princípio:** Compressão com zstd

**Características:**
- Compressão alta (3-4x)
- Compressão rápida
- Suporte crescente
- Adequado para uso geral

**Implementação:**
```python
import zstandard as zstd

def compress_with_zstd(input_file, output_file):
    """Comprimir arquivo com zstd"""
    compressor = zstd.ZstdCompressor()
    
    with open(input_file, 'rb') as f_in:
        with open(output_file, 'wb') as f_out:
            f_out.write(compressor.compress(f_in.read()))
```

## Estratégias de retenção

### 1. Retenção por tempo

**Princípio:** Manter backups por um período de tempo

**Implementação:**
```python
import os
from datetime import datetime, timedelta

def cleanup_old_backups(backup_path, retention_days=30):
    """Remover backups antigos"""
    cutoff = datetime.now() - timedelta(days=retention_days)
    
    for filename in os.listdir(backup_path):
        filepath = os.path.join(backup_path, filename)
        
        if os.path.isfile(filepath):
            file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
            
            if file_time < cutoff:
                os.remove(filepath)
```

### 2. Retenção por número

**Princípio:** Manter N backups mais recentes

**Implementação:**
```python
import os

def cleanup_by_count(backup_path, keep_count=10):
    """Manter apenas N backups mais recentes"""
    files = []
    
    for filename in os.listdir(backup_path):
        filepath = os.path.join(backup_path, filename)
        
        if os.path.isfile(filepath):
            files.append((filepath, os.path.getmtime(filepath)))
    
    # Ordenar por timestamp
    files.sort(key=lambda x: x[1], reverse=True)
    
    # Remover backups antigos
    for filepath, _ in files[keep_count:]:
        os.remove(filepath)
```

### 3. Retenção hierárquica

**Princípio:** Manter backups com diferentes frequências (diário, semanal, mensal)

**Implementação:**
```python
from datetime import datetime, timedelta

def hierarchical_retention(backup_path):
    """Retenção hierárquica"""
    now = datetime.now()
    
    # Manter backups diários dos últimos 7 dias
    daily_cutoff = now - timedelta(days=7)
    
    # Manter backups semanais das últimas 4 semanas
    weekly_cutoff = now - timedelta(weeks=4)
    
    # Manter backups mensais dos últimos 12 meses
    monthly_cutoff = now - timedelta(days=365)
    
    # Implementar lógica de retenção
    # ...
```

## Estratégias de restauração

### 1. Restauração completa

**Princípio:** Restaurar todo o backup

**Implementação:**
```python
def restore_full_backup(backup_file, db_config):
    """Restaurar backup completo"""
    import subprocess
    cmd = f"pg_restore -h {db_config['host']} -U {db_config['user']} -d {db_config['dbname']} {backup_file}"
    subprocess.run(cmd, shell=True, check=True)
```

### 2. Restauração pontual

**Princípio:** Restaurar até um ponto específico no tempo

**Implementação:**
```python
def restore_point_in_time(backup_file, db_config, target_time):
    """Restaurar até um ponto no tempo"""
    # Requer WAL archiving no PostgreSQL
    import subprocess
    cmd = f"pg_restore -h {db_config['host']} -U {db_config['user']} -d {db_config['dbname']} --recovery-target-time '{target_time}' {backup_file}"
    subprocess.run(cmd, shell=True, check=True)
```

### 3. Restauração seletiva

**Princípio:** Restaurar apenas embeddings específicos

**Implementação:**
```python
def restore_selective(backup_file, db_config, embedding_ids):
    """Restaurar embeddings específicos"""
    # Carregar backup
    # Filtrar por IDs
    # Inserir no banco
    # ...
```

## Monitoramento e alertas

### Métricas a monitorar

- **Tamanho do backup:** Tamanho dos arquivos de backup
- **Tempo de backup:** Duração do processo de backup
- **Taxa de sucesso:** % de backups bem-sucedidos
- **Tempo de restauração:** Duração do processo de restauração
- **Espaço em disco:** Uso de armazenamento de backups

**Implementação de monitoramento:**
```python
from prometheus_client import Gauge, Histogram

backup_size = Gauge('backup_size_bytes', 'Backup size')
backup_duration = Histogram('backup_duration_seconds', 'Backup duration')
backup_success = Gauge('backup_success', 'Backup success rate')

class MonitoredBackup:
    def __init__(self, backup_func):
        self.backup_func = backup_func
    
    def backup(self, *args, **kwargs):
        start = time.time()
        
        try:
            result = self.backup_func(*args, **kwargs)
            
            # Registrar tamanho
            if os.path.exists(result):
                backup_size.set(os.path.getsize(result))
            
            backup_success.set(1)
            return result
        except Exception as e:
            backup_success.set(0)
            raise
        finally:
            backup_duration.observe(time.time() - start)
```

## Recomendações

### Para desenvolvimento
- **Estratégia:** Full backup local
- **Frequência:** Diária
- **Retenção:** 7 dias
- **Compressão:** Gzip
- **Armazenamento:** Local

### Para produção (pequeno)
- **Estratégia:** Full backup + Incremental
- **Frequência:** Full semanal, incremental diário
- **Retenção:** Full 4Sem, incremental 7 dias
- **Compressão:** Zstandard
- **Armazenamento:** S3

### Para produção (grande)
- **Estratégia:** Snapshot + Incremental
- **Frequência:** Snapshot diário, incremental por hora
- **Retenção:** Snapshot 30 dias, incremental 7 dias
- **Compressão:** Zstandard
- **Armazenamento:** S3 + Glacier

### Para compliance
- **Estratégia:** Full backup + Differential
- **Frequência:** Full mensal, diferencial semanal
- **Retenção:** Hierárquica (7 dias, 4 semanas, 12 meses)
- **Compressão:** LZMA
- **Armazenamento:** S3 + Glacier

## Próximos passos

1. **Escolher estratégia:** Selecionar baseado em tamanho e requisitos
2. **Implementar backup:** Criar script de backup
3. **Configurar agendamento:** Usar cron ou scheduler
4. **Testar restauração:** Validar processo de restore
5. **Configurar monitoramento:** Métricas e alertas
6. **Documentar procedimento:** Guia de disaster recovery

## Referências

- PostgreSQL Backup: https://www.postgresql.org/docs/current/backup-dump.html
- Qdrant Snapshots: https://qdrant.tech/documentation/concepts/snapshots/
- AWS S3: https://docs.aws.amazon.com/s3/
- Google Cloud Storage: https://cloud.google.com/storage/docs
