"""
Modelos de dados para processos SEI
"""
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Processo(Base):
    """Modelo para processos SEI"""
    __tablename__ = "processos"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Campos compatíveis com API
    numero = Column(String(50), unique=True, nullable=False, index=True)  # Mudança: numero_sei -> numero
    tipo = Column(String(200), nullable=False)  # Mudança: adicionado nullable=False
    assunto = Column(Text)  # Novo campo
    interessado = Column(Text)  # Mudança: interessados -> interessado
    situacao = Column(String(50), default='Em tramitação')  # Mudança: status -> situacao
    data_autuacao = Column(Date, nullable=False)  # Mudança: data_geracao -> data_autuacao
    orgao_autuador = Column(String(200))  # Novo campo
    url_processo = Column(Text)  # Mudança: url -> url_processo
    
    # Campos técnicos
    hash_conteudo = Column(String(100))  # Novo campo
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    autuacao = relationship("Autuacao", back_populates="processo", uselist=False)
    documentos = relationship("Documento", back_populates="processo")
    andamentos = relationship("Andamento", back_populates="processo")
    
    def __repr__(self):
        return f"<Processo(numero='{self.numero}', situacao='{self.situacao}')>"


class Autuacao(Base):
    """Modelo para autuação do processo"""
    __tablename__ = "autuacoes"
    
    id = Column(Integer, primary_key=True, index=True)
    processo_id = Column(Integer, ForeignKey("processos.id"), nullable=False)
    numero_sei = Column(String(50), nullable=False)
    tipo = Column(String(200))
    data_geracao = Column(Date)
    interessados = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    processo = relationship("Processo", back_populates="autuacao")
    
    # Constraint de unicidade
    __table_args__ = (UniqueConstraint('processo_id', name='uq_autuacao_processo'),)
    
    def __repr__(self):
        return f"<Autuacao(numero_sei='{self.numero_sei}', processo_id={self.processo_id})>"


class Documento(Base):
    """Modelo para documentos do processo"""
    __tablename__ = "documentos"
    
    id = Column(Integer, primary_key=True, index=True)
    processo_id = Column(Integer, ForeignKey("processos.id"), nullable=False)
    numero_documento = Column(String(50), nullable=False)
    tipo = Column(String(200))
    data_documento = Column(Date)
    data_inclusao = Column(Date)
    unidade = Column(String(100))
    arquivo_path = Column(String(500))
    downloaded = Column(Boolean, default=False)
    
    # Campos para detalhamento LLM
    detalhamento_texto = Column(Text)
    detalhamento_status = Column(String(20), default='pendente')  # pendente, processando, concluido, erro
    detalhamento_data = Column(DateTime)
    detalhamento_modelo = Column(String(100))  # modelo LLM usado
    detalhamento_tokens = Column(Integer)  # tokens usados no processamento
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    processo = relationship("Processo", back_populates="documentos")
    tags = relationship("DocumentoTag", back_populates="documento")
    entidades = relationship("DocumentoEntidade", back_populates="documento")
    
    # Constraint de unicidade
    __table_args__ = (UniqueConstraint('processo_id', 'numero_documento', name='uq_documento_processo'),)
    
    def __repr__(self):
        return f"<Documento(numero_documento='{self.numero_documento}', tipo='{self.tipo}')>"


class DocumentoTag(Base):
    """Modelo para tags de classificação de documentos"""
    __tablename__ = "documento_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    documento_id = Column(Integer, ForeignKey("documentos.id"), nullable=False)
    tag = Column(String(100), nullable=False)
    confianca = Column(Numeric(3, 2))  # 0.00 a 1.00
    origem = Column(String(20), default='llm')  # llm, manual, regex
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    documento = relationship("Documento", back_populates="tags")
    
    # Constraint de unicidade
    __table_args__ = (UniqueConstraint('documento_id', 'tag', name='uq_documento_tag'),)
    
    def __repr__(self):
        return f"<DocumentoTag(tag='{self.tag}', confianca={self.confianca})>"


class DocumentoEntidade(Base):
    """Modelo para entidades extraídas dos documentos"""
    __tablename__ = "documento_entidades"
    
    id = Column(Integer, primary_key=True, index=True)
    documento_id = Column(Integer, ForeignKey("documentos.id"), nullable=False)
    tipo_entidade = Column(String(50), nullable=False)  # pessoa, empresa, valor, data, local, etc
    valor = Column(Text, nullable=False)
    contexto = Column(Text)  # frase onde foi encontrada
    posicao_inicio = Column(Integer)
    posicao_fim = Column(Integer)
    confianca = Column(Numeric(3, 2))
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    documento = relationship("Documento", back_populates="entidades")
    
    def __repr__(self):
        return f"<DocumentoEntidade(tipo='{self.tipo_entidade}', valor='{self.valor}')>"


class Andamento(Base):
    """Modelo para andamentos do processo"""
    __tablename__ = "andamentos"
    
    id = Column(Integer, primary_key=True, index=True)
    processo_id = Column(Integer, ForeignKey("processos.id"), nullable=False)
    data_hora = Column(DateTime, nullable=False)
    unidade = Column(String(100))
    descricao = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    processo = relationship("Processo", back_populates="andamentos")
    
    # Constraint de unicidade para evitar duplicatas
    __table_args__ = (
        UniqueConstraint('processo_id', 'data_hora', 'unidade', 'descricao', name='uq_andamento_completo'),
    )
    
    def __repr__(self):
        return f"<Andamento(data_hora='{self.data_hora}', unidade='{self.unidade}')>" 