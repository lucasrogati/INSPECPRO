-- ============================================================
-- Sistema de Gestão de Inspeções, Anomalias e Manutenção Predial
-- Schema MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS inspecpro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inspecpro;

-- ------------------------------------------------------------
-- usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo ENUM('administrador', 'engenheiro', 'manutencao', 'gestor') NOT NULL DEFAULT 'gestor',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- predios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ambientes  (Prédio -> Bloco -> Andar -> Ambiente)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ambientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  predio_id INT NOT NULL,
  bloco VARCHAR(50),
  andar VARCHAR(50),
  nome VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ambientes_predio FOREIGN KEY (predio_id) REFERENCES predios(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- inspecoes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspecoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  predio_id INT NOT NULL,
  usuario_id INT NOT NULL,
  data_inspecao DATE NOT NULL,
  observacoes TEXT,
  status ENUM('planejada', 'em_andamento', 'concluida') NOT NULL DEFAULT 'planejada',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inspecoes_predio FOREIGN KEY (predio_id) REFERENCES predios(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inspecoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- anomalias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anomalias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspecao_id INT NOT NULL,
  ambiente_id INT NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(80),
  prioridade ENUM('baixa', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
  status ENUM('identificado', 'pendente', 'em_manutencao', 'aguardando_verificacao', 'resolvido')
    NOT NULL DEFAULT 'identificado',
  responsavel_id INT,
  prazo DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_anomalias_inspecao FOREIGN KEY (inspecao_id) REFERENCES inspecoes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_anomalias_ambiente FOREIGN KEY (ambiente_id) REFERENCES ambientes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_anomalias_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- fotos_anomalia
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fotos_anomalia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  anomalia_id INT NOT NULL,
  imagem VARCHAR(500) NOT NULL,
  data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fotos_anomalia FOREIGN KEY (anomalia_id) REFERENCES anomalias(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- manutencoes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manutencoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  anomalia_id INT NOT NULL,
  responsavel_id INT NOT NULL,
  descricao TEXT,
  data_inicio DATE,
  data_conclusao DATE,
  status ENUM('agendada', 'em_andamento', 'concluida') NOT NULL DEFAULT 'agendada',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_manutencoes_anomalia FOREIGN KEY (anomalia_id) REFERENCES anomalias(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_manutencoes_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- historico_anomalia
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico_anomalia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  anomalia_id INT NOT NULL,
  usuario_id INT NOT NULL,
  descricao TEXT,
  status_anterior VARCHAR(40),
  status_novo VARCHAR(40),
  data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historico_anomalia FOREIGN KEY (anomalia_id) REFERENCES anomalias(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Índices auxiliares (performance de filtros/consultas comuns)
-- ------------------------------------------------------------
CREATE INDEX idx_ambientes_predio ON ambientes(predio_id);
CREATE INDEX idx_inspecoes_predio ON inspecoes(predio_id);
CREATE INDEX idx_inspecoes_usuario ON inspecoes(usuario_id);
CREATE INDEX idx_anomalias_inspecao ON anomalias(inspecao_id);
CREATE INDEX idx_anomalias_ambiente ON anomalias(ambiente_id);
CREATE INDEX idx_anomalias_status ON anomalias(status);
CREATE INDEX idx_anomalias_prioridade ON anomalias(prioridade);
CREATE INDEX idx_anomalias_responsavel ON anomalias(responsavel_id);
CREATE INDEX idx_manutencoes_anomalia ON manutencoes(anomalia_id);
CREATE INDEX idx_historico_anomalia ON historico_anomalia(anomalia_id);
