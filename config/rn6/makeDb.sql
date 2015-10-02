-- -------------------
--                  --
--  rn6
--                  --
-- -------------------
drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text not null,
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
"/srv/epgg/data/data/subtleKnife/rn6/",
"/srv/epgg/data/data/subtleKnife/seq/rn6.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"chr4,146758741,chr4,147070282",
"refGene,rmsk_all",
"chr1,chr2,chr3,chr4,chr5,chr6,chr7,chr8,chr9,chr10,chr11,chr12,chr13,chr14,chr15,chr16,chr17,chr18,chr19,chr20,chrX,chrY,chrM",
true,
true,
"rno",
"Assembly version|rn6|Sequence source|<a href=http://hgdownload.soe.ucsc.edu/goldenPath/rn6/bigZips/ target=_blank>UCSC Genome Browser</a>|Date parsed|October 2, 2015|Chromosomes|23|Contigs & misc|930|Total bases|2,870,182,909|Logo art|<a href=http://en.wikipedia.org/wiki/File:Rat_diabetic.jpg target=_blank>link</a>",
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

drop table if exists cytoband;
create table cytoband (
  id int unsigned not null primary key auto_increment,
  chrom char(10) not null,
  start int not null,
  stop int not null,
  name char(20) not null,
  colorIdx tinyint not null
);
load data local infile "cytoband" into table cytoband;
