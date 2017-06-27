# Epigenome Browser with Calling Card Support (EGCC)

This is a guide to installing a local copy of the EGCC browser for visualization of calling card data.

## Install Docker

If you already have Docker installed, proceed to the next section. Otherwise, install Docker on to your computer. Find the installation package specific for your operating system on the [Docker Store website](https://store.docker.com/search?type=edition&offering=community). (Don't worry, it's free)

After installation, start Docker. On a Mac, you should see an whale icon in the menu bar. Click on it to open the drop-down menu. Check that Docker is running.

## Run the Browser

Open a Terminal window and enter the following command:
`docker pull arnavm/egcc`
This ensures that you are running the latest version of the browser.

To start the browser, run the following command:
`docker run -p 80:80 -i -t arnavm/egcc`

You may see the following text; this is normal, do not be alarmed.

```Enabling module headers.
To activate the new configuration, you need to run:
  service apache2 restart
AH00558: apache2: Could not reliably determine the server's fully qualified domain name, using 172.17.0.2. Set the 'ServerName' directive globally to suppress this message
Your MPM seems to be threaded. Selecting cgid instead of cgi.
Enabling module cgid.
To activate the new configuration, you need to run:
  service apache2 restart
 * Starting Apache httpd web server apache2
 AH00558: apache2: Could not reliably determine the server's fully qualified domain name, using 172.17.0.2. Set the 'ServerName' directive globally to suppress this message
 *
 * Starting MySQL database server mysqld
 No directory, logging in with HOME=/
														[ OK ]```

Wait until you see a command prompt in your terminal window. Confirm that the browser works by opening a web browser and going to the following address:
`http://localhost/browser/`

Currently, only hg19 and mm10 are supported.

## Format the Data

Calling card data must be stored in a tab-delimited, plain text format. This format requires a minimum of four colums and can support up to six. The four required columns are CHROM, START, STOP, and COUNT, where COUNT refers to the number of reads for that insertion. The fifth and sixth columns are optional and represent STRAND and BARCODE, respectively. Here is an example of a four-column calling card file:
```
chr1    41954321        41954325        1
chr1    41954321        41954325        18
chr1    52655214        52655218        1
chr1    52655214        52655218        1
chr1    54690384        54690388        3
chr1    54713998        54714002        1
chr1    54713998        54714002        1
chr1    54713998        54714002        13
chr1    54747055        54747059        1
chr1    54747055        54747059        4
chr1    60748489        60748493        2
```

Here is an example of a six-column calling card file:
```
chr1    51441754        51441758        1       -       CTAGAGACTGGC
chr1    51441754        51441758        21      -       CTTTCCTCCCCA
chr1    51982564        51982568        3       +       CGCGATCGCGAC
chr1    52196476        52196480        1       +       AGAATATCTTCA
chr1    52341019        52341023        1       +       TACGAAACACTA
chr1    59951043        59951047        1       +       ACAAGACCCCAA
chr1    59951043        59951047        1       +       ACAAGAGAGACT
chr1    61106283        61106287        1       -       ATGCACTACTTC
chr1    61106283        61106287        7       -       CGTTTTTCACCT
chr1    61542006        61542010        1       -       CTGAGAGACTGG
```

Your text file must be sorted by the first three columns. If your filename is `example.ccf`, you sort it with the following command:
`sort -k1V -k2n -k3n example.ccf > example_sorted.ccf`

Note that you can have strand information without a barcode, but you cannot put barcode information without a strand column.

The browser currently supports data upload via datahub, which will fetch your data over the Internet. Therefore, we must put the data into a web-accessible location.

I have created a folder, `/scratch/rmlab/public/`, where you can store data on the cluster and retrieve it from a brower. The `address` file in this folder contains the current URL for this directory. This address is valid for 120 days and may change after that point. Always check the `address` file for the current URL. Verify access by visiting this URL with your web browser.

Place your sorted text file in the `public` folder. Since genomic data is often large, we must compress and index it for fast retrieval. Use the following commands to do so:
```
module load htslib
bgzip example_sorted.ccf
tabix -p bed example_sorted.ccf.gz
```

## Upload the Data

A JSON file is need to upload data and create tracks on the browser. Here is the structure of a simple, two-track JSON file:
```JSON
[
	# this is comment
	{
	    "type":"bedgraph",
	    "url":"https://htcf.wustl.edu/files/vdY5b0dP/test2.bedgraph.gz",
	    "name":"test2",
	    "mode":"show",
	    "colorpositive":"#ff33cc",
	    "height":50
	},
	{
	    "type":"callingcard",
	    "url":"https://htcf.wustl.edu/files/vdY5b0dP/test5.cc.gz",
	    "name":"N2A Brd4",
	    "mode":"show",
	    "colorpositive":"#ff33cc",
	    "height":50
	}
]
```

Note that all strings must be in quotation marks, while numerical values need not. Here, the colorpositive and height specifications are optional. To add more tracks, enclose them in braces within the brackets and separate the braces with commas. More information about supported file types and how to format them can be found at the [WashU EpiGenome Browser wiki](http://wiki.wubrowse.org).

Save the JSON file on your local computer. It is not necessary to save this file to the HTCF cluster. To upload data, open the appropriate reference genome in the browser (hg19 or mm10), click on "Tracks", then "Custom Tracks", then "Add new tracks". Click on the "Datahub by upload" button, then select your JSON file. If everything works perfectly, your data should now be visible on the browser!

## Known Issues

If the browser crashes or you need to reset your workspace, refresh the browser.
### Specific to Calling Cards
1. Calling card data will not display properly if zoom level is too high. As long as 1 pixel > 1 base, data should draw correctly.
### Issues with Local Browser
1. Gene lookup in hg19 does not work, but does work in mm10. 
2. Cannot export to PDF for publication-quality images.
3. Cannot upload bigWig files. If you have bigWig data, convert it to bedgraph and then upload it. Bedgraph files need to be indexed exactly the same way as calling card files.
4. Occasionally, you may lose your connection to the Internet. Don't know why this happens, but if it does, exit the program (see "Finishing Up"), then click on the Docker menu bar icon and select "Restart" to restart Docker. This should restore Internet access.

## Finishing Up

When you are finished with the browser, return to the Terminal window, type `exit`, and hit Enter.