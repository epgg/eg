drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text null,
  defaultCustomtracks text not null,
  defaultPosition varchar(255) not null,
  defaultDecor text null,
  defaultScaffold text not null,
  hasGene boolean not null,
  allowJuxtaposition boolean not null,
  keggSpeciesCode varchar(255) null,
  information text not null,
  runmode tinyint not null,
  initmatplot boolean not null
);
insert into config values(
"/srv/epgg/data/data/subtleKnife/macFas_BGI/",
"/srv/epgg/data/data/subtleKnife/seq/macFas_BGI.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"chr3,100083068,chr3,100319736",
"gene,rmsk_ensemble",
"chr1,chr2,chr3,chr4,chr5,chr6,chr7,chr8,chr9,chr10,chr11,chr12,chr13,chr14,chr15,chr16,chr17,chr18,chr19,chr20,chrX",
true,
true,
\N,
"Scientific name|Macaca fascicularis|Assembly version|CE 1|Sequence source|<a href=http://climb.genomics.cn/Macaca_fascicularis target=_blank>BGI (Beijing Genomics Institute)</a>|Date parsed|Dec 8, 2013|Chromosomes|21|Logo art|<a href=http://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Crab-eating_Macaque_tree.jpg/220px-Crab-eating_Macaque_tree.jpg target=_blank>link</a>",
0,
false
);


drop table if exists tempURL;
create table tempURL (
  session varchar(100) not null,
  offset INT unsigned not null,
  urlpiece text not null
);


drop table if exists scaffoldInfo;
create table scaffoldInfo (
  parent varchar(255) not null,
  child varchar(255) not null,
  childLength int unsigned not null
);
load data local infile "scaffoldInfo" into table scaffoldInfo;
