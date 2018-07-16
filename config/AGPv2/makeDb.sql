drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text not null,
  defaultCustomtracks text not null,
  defaultPosition varchar(255) not null,
  defaultDataset varchar(255) not null,
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
"/srv/epgg/data/data/subtleKnife/b73_AGPv2/",
"/srv/epgg/data/data/subtleKnife/seq/AGPv2.gz",
"gst23\\ngst40\\ngst8\\ngst30\\ngst14\\ngst11\\ngst12\\ngst16\\ngst7\\ngst19\\ngst41\\ngst9\\ngst35\\ngst24\\ngst31\\nBz2",
"{3:{url:'https://vizhub.wustl.edu/hubSample/AGPv2/rand4.gz',name:'example bedgraph track'},1:{url:'https://vizhub.wustl.edu/hubSample/AGPv2/sample.gz',name:'example bed track'},100:{url:'https://vizhub.wustl.edu/hubSample/AGPv2/hub'}}",
"chr1,11500000,chr1,12000000",
"mock",
"refGene,AGPv2_5a",
"chr1,chr2,chr3,chr4,chr5,chr6,chr7,chr8,chr9,chr10",
true,
true,
"zma",
"Strain|B73|Assembly version|AGPv2|Sequence source|<a href=https://www.maizesequence.org target=_blank>maizesequence.org</a>|Date parsed|May 19, 2012|Chromosomes|13|Contigs|0|Total bases|3,232,254,451|Logo art|<a href=https://en.wikipedia.org/wiki/File:Zea_mays_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-283.jpg target=_blank>link</a>",
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
  id int unique auto_increment primary key,
  chrom char(20) not null,
  start int not null,
  stop int not null,
  name char(20) not null,
  colorIdx int not null
);
load data local infile "cytoband" into table cytoband;
