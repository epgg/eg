drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text not null,
  defaultCustomtracks text null,
  defaultPosition varchar(255) not null,
  defaultDecor text null,
  defaultScaffold text null,
  hasGene boolean not null,
  allowJuxtaposition boolean not null,
  keggSpeciesCode varchar(255) not null,
  information text not null,
  runmode tinyint not null,
  initmatplot boolean not null
);
insert into config values(
"/srv/epgg/data/data/subtleKnife/hg19/",
"/srv/epgg/data/data/subtleKnife/seq/hg19.gz",
"CYP4A22\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP1A2\\nCYP4V2\\nCYP51A1\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{3:{url:'http://vizhub.wustl.edu/hubSample/hg19/GSM429321.gz',name:'example bedGraph track'},1:{url:'http://vizhub.wustl.edu/hubSample/hg19/bed.gz',name:'example bed track'},10:{url:'http://vizhub.wustl.edu/hubSample/hg19/K562POL2.gz',name:'example interaction track'},15:{url:'http://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig',name:'example bigwig track'},100:{url:'http://vizhub.wustl.edu/hubSample/hg19/hub.json'},18:{url:'http://vizhub.wustl.edu/hubSample/hg19/bam1.bam',name:'example bam track'},25:{url:'http://vizhub.wustl.edu/hubSample/hg19/refGene.gz',name:'Custom gene track'},21:{mm9:'http://vizhub.wustl.edu/public/hg19/weaver/hg19_mm9_axt.gz',mm10:'http://vizhub.wustl.edu/public/hg19/weaver/hg19_mm10_axt.gz',rn4:'http://vizhub.wustl.edu/public/hg19/weaver/hg19_rn4_axt.gz',danRer7:'http://vizhub.wustl.edu/public/hg19/weaver/hg19_danRer7_axt.gz'},30:{url:'http://epgg-test.wustl.edu/dli/long-range-test/test.hic',name:'test HiC track'},32:{url:'http://vizhub.wustl.edu/hubSample/hg19/bigBed1',name:'example bigBed track'},34:{url:'dli/long-range-test/cool/test.cool',name:'example cool track'}}",
"chr7,27053398,chr7,27373766",
"refGene,rmsk_all",
"chr1,chr2,chr3,chr4,chr5,chr6,chr7,chr8,chr9,chr10,chr11,chr12,chr13,chr14,chr15,chr16,chr17,chr18,chr19,chr20,chr21,chr22,chrX,chrY,chrM",
true,
true,
"hsa",
"Assembly version|hg19|Sequence source|<a href=http://hgdownload.cse.ucsc.edu/goldenPath/hg19/bigZips/ target=_blank>UCSC browser</a>|Date parsed|June 1, 2011|Chromosomes|25|Contigs & misc|68|Total bases|3,137,144,693|Logo art|<a href=http://turing.iimas.unam.mx/~cgg/gallery/EverybodysHive.html target=_blank>link</a>",
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
  id int null auto_increment primary key,
  chrom char(20) not null,
  start int not null,
  stop int not null,
  name char(20) not null,
  colorIdx int not null
);
load data local infile "cytoband" into table cytoband;


