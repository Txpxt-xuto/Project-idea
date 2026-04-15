/*
 * ============================================================
 *  RODCHAOMAHACHAI  —  Car Rental HTTP Backend
 *  Compile:  gcc server.c -o server
 *  Run:      ./server
 *  Port:     8080
 *
 *  Endpoints (JSON over HTTP):
 *    GET  /availability?start=YYYY-MM-DD&end=YYYY-MM-DD
 *         -> ส่งรายการรถที่ว่าง / ไม่ว่าง ในช่วงวันนั้น
 *
 *    POST /book
 *         body: JSON { carId, startDate, endDate,
 *                      firstName, lastName, phone, email, delivery }
 *         -> จองรถ บันทึก CUSTOMER.csv + CAR.csv
 *         -> ตอบ { ok, refCode }
 *
 *    POST /cancel
 *         body: JSON { firstName, lastName }
 *         -> ยกเลิกการจอง
 *         -> ตอบ { ok, message }
 *
 *    GET  /status
 *         -> ตอบ { ok: true }  (health check)
 * ============================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#ifdef _WIN32
  #include <winsock2.h>
  #include <ws2tcpip.h>
  #pragma comment(lib,"ws2_32.lib")
  typedef int socklen_t;
  #define close closesocket
#else
  #include <unistd.h>
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <arpa/inet.h>
#endif

/* ─── config ─────────────────────────────────────────────── */
#define PORT        8080
#define BUF         65536
#define MAX_CARS    20
#define MAX_DAYS    370
#define CAR_FILE    "CAR.csv"
#define CUST_FILE   "CUSTOMER.csv"

/* ─── car struct ──────────────────────────────────────────── */
typedef struct {
    int  number;   /* ลำดับที่ใน CSV (1-based) */
    int  id;       /* ราคา/วัน                 */
    char model[64];
    int  booked[MAX_DAYS]; /* 0=ว่าง 1=จอง (index=dayOfYear) */
} Car;

static Car cars[MAX_CARS];
static int numCars = 0;

/* ─── helper: leap year ───────────────────────────────────── */
static int isLeap(int y){
    return (y%4==0 && y%100!=0)||(y%400==0);
}
static int daysInMonth(int m,int y){
    int d[]={31,28,31,30,31,30,31,31,30,31,30,31};
    if(m==2&&isLeap(y)) return 29;
    return d[m-1];
}
/* แปลง YYYY-MM-DD → day index เทียบกับ 1 ม.ค. ปีเดียวกัน */
static int dateToDayIndex(const char *s){
    int y,m,d;
    if(sscanf(s,"%d-%d-%d",&y,&m,&d)!=3) return -1;
    int idx=d;
    for(int i=1;i<m;i++) idx+=daysInMonth(i,y);
    /* ถ้าข้ามปีจาก base year (2026) */
    int base=2026;
    for(int i=base;i<y;i++){
        idx+=isLeap(i)?366:365;
    }
    return idx;   /* 1-based day-of-year (with multi-year support) */
}

/* ─── load CAR.csv ────────────────────────────────────────── */
static void loadCars(void){
    FILE *fp=fopen(CAR_FILE,"r");
    if(!fp){ fprintf(stderr,"[ERR] cannot open %s\n",CAR_FILE); return; }

    char line[20000];
    int row=0;
    numCars=0;

    while(fgets(line,sizeof(line),fp)){
        row++;
        if(row==1) continue; /* skip header */
        if(numCars>=MAX_CARS) break;

        Car *c=&cars[numCars];
        memset(c,0,sizeof(Car));

        int col=0;
        char *tok=strtok(line,",");
        int dayIdx=0;

        while(tok){
            tok[strcspn(tok,"\n")]=0;
            if(col==0)      c->number=atoi(tok);
            else if(col==1) c->id    =atoi(tok);
            else if(col==2) strncpy(c->model,tok,63);
            else {
                /* col 3 = day:1, col 4 = day:2, … */
                if(dayIdx<MAX_DAYS)
                    c->booked[dayIdx]=atoi(tok);
                dayIdx++;
            }
            tok=strtok(NULL,",");
            col++;
        }
        numCars++;
    }
    fclose(fp);
}

/* ─── save CAR.csv ────────────────────────────────────────── */
static void saveCars(void){
    /* อ่าน header เดิมก่อน */
    FILE *in=fopen(CAR_FILE,"r");
    char header[20000]="";
    if(in){ fgets(header,sizeof(header),in); fclose(in); }

    FILE *fp=fopen(CAR_FILE,"w");
    if(!fp){ fprintf(stderr,"[ERR] cannot write %s\n",CAR_FILE); return; }

    /* เขียน header */
    fprintf(fp,"%s",header);

    for(int i=0;i<numCars;i++){
        Car *c=&cars[i];
        fprintf(fp,"%d,%d,%s",c->number,c->id,c->model);
        for(int d=0;d<MAX_DAYS;d++) fprintf(fp,",%d",c->booked[d]);
        fprintf(fp,"\n");
    }
    fclose(fp);
}

/* ─── check availability (returns 1=available, 0=not) ─────── */
static int isAvailable(int carIdx, int startDay, int endDay){
    Car *c=&cars[carIdx];
    for(int d=startDay;d<=endDay;d++){
        int idx=d-1; /* 0-based array */
        if(idx>=0 && idx<MAX_DAYS && c->booked[idx]!=0) return 0;
    }
    return 1;
}

/* ─── book car ────────────────────────────────────────────── */
static void bookCar(int carIdx, int startDay, int endDay){
    Car *c=&cars[carIdx];
    for(int d=startDay;d<=endDay;d++){
        int idx=d-1;
        if(idx>=0&&idx<MAX_DAYS) c->booked[idx]=1;
    }
    saveCars();
}

/* ─── cancel car ──────────────────────────────────────────── */
static void cancelCar(int carIdx, int startDay, int endDay){
    Car *c=&cars[carIdx];
    for(int d=startDay;d<=endDay;d++){
        int idx=d-1;
        if(idx>=0&&idx<MAX_DAYS) c->booked[idx]=0;
    }
    saveCars();
}

/* ─── append to CUSTOMER.csv ──────────────────────────────── */
/* CSV columns (ตรงกับ header):
   รถยนต์,ชื่อ,นามสกุล,เบอร์โทร,อีเมล,เลขประจำตัวประชาชน,
   วันเริ่มต้นการเช่า,วันสิ้นสุดการเช่า,สถานที่,วันที่บันทึก,
   วิธีการชำระ,ชื่อบนบัตรหรือชื่อบัญชี,หมายเลขบัตรหรือรหัสอ้างอิง,
   เวลาหรือ cvv,วันเดือนปีหรือวันหมดอายุ,จำนวนเงิน            */
static void saveCustomer(
        const char *carModel,
        const char *fname,    const char *lname,
        const char *phone,    const char *email,
        const char *idCard,
        const char *startDate,const char *endDate,
        const char *location,
        const char *payMethod,
        const char *cardName, const char *cardNumber,
        const char *timeOrCvv,const char *expiry,
        const char *total){

    FILE *fp=fopen(CUST_FILE,"a");
    if(!fp){ fprintf(stderr,"[ERR] cannot open %s\n",CUST_FILE); return; }

    time_t now=time(NULL);
    struct tm *t=localtime(&now);
    char today[20];
    strftime(today,sizeof(today),"%Y-%m-%d",t);

    /* ทุก field ห้ามมี comma — sanitize เบื้องต้น */
    #define SAFE(s) ((s)&&(s)[0] ? (s) : "-")

    fprintf(fp,"%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",SAFE(carModel),
        SAFE(fname),   SAFE(lname),
        SAFE(phone),   SAFE(email),
        SAFE(idCard),
        SAFE(startDate),SAFE(endDate),
        SAFE(location),
        today,
        SAFE(payMethod),
        SAFE(cardName), SAFE(cardNumber),
        SAFE(timeOrCvv),SAFE(expiry),
        SAFE(total));
    #undef SAFE

    fclose(fp);
}

/* ─── delete customer from CSV ────────────────────────────── */
static int deleteCustomer(const char *fname,const char *lname,
                          int *outCarIdx, int *outStart, int *outEnd){
    FILE *fp=fopen(CUST_FILE,"r");
    if(!fp) return 0;

    char lines[500][512];
    int count=0;
    int foundLine=-1;

    while(fgets(lines[count],512,fp) && count<499){
        char tmp[512];
        strcpy(tmp,lines[count]);
        /* col: carModel,fname,lname,phone,email,startDate,endDate,delivery,recordDate */
        char *model=strtok(tmp,",");
        char *fn   =strtok(NULL,",");
        char *ln   =strtok(NULL,",");

        if(fn&&ln){
            fn[strcspn(fn,"\n")]=0;
            ln[strcspn(ln,"\n")]=0;
            if(strcmp(fn,fname)==0&&strcmp(ln,lname)==0){
                foundLine=count;
                /* หา carIdx, start, end */
                char tmp2[512]; strcpy(tmp2,lines[count]);
                char *m2   =strtok(tmp2,",");
                char *fn2  =strtok(NULL,",");
                char *ln2  =strtok(NULL,",");
                char *ph2  =strtok(NULL,",");
                char *em2  =strtok(NULL,",");
                char *sd   =strtok(NULL,",");
                char *ed   =strtok(NULL,",");
                if(sd&&ed){
                    sd[strcspn(sd,"\n")]=0;
                    ed[strcspn(ed,"\n")]=0;
                    *outStart=dateToDayIndex(sd);
                    *outEnd  =dateToDayIndex(ed);
                }
                /* หา car index จาก model name */
                if(m2){
                    m2[strcspn(m2,"\n")]=0;
                    *outCarIdx=-1;
                    for(int i=0;i<numCars;i++){
                        if(strcmp(cars[i].model,m2)==0){ *outCarIdx=i; break; }
                    }
                }
            }
        }
        count++;
    }
    fclose(fp);
    if(foundLine<0) return 0;

    /* เขียนไฟล์ใหม่โดยข้ามบรรทัดนั้น */
    FILE *out=fopen(CUST_FILE,"w");
    if(!out) return 0;
    for(int i=0;i<count;i++){
        if(i!=foundLine) fprintf(out,"%s",lines[i]);
    }
    fclose(out);
    return 1;
}

/* ══════════════════════════════════════════════════════════════
   HTTP helpers
   ══════════════════════════════════════════════════════════════ */

static void sendResponse(int sock, int code, const char *body){
    const char *status = code==200 ? "200 OK"
                       : code==400 ? "400 Bad Request"
                       : code==404 ? "404 Not Found"
                       :             "500 Internal Server Error";
    char header[512];
    int hlen=snprintf(header,sizeof(header),
        "HTTP/1.1 %s\r\n"
        "Content-Type: application/json; charset=utf-8\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Content-Length: %zu\r\n"
        "Connection: close\r\n"
        "\r\n",
        status, strlen(body));
    send(sock,header,hlen,0);
    send(sock,body,strlen(body),0);
}

/* ดึง query param value จาก URL  ?key=value&... */
static int getParam(const char *url, const char *key, char *out, int outLen){
    char search[64];
    snprintf(search,sizeof(search),"%s=",key);
    const char *p=strstr(url,search);
    if(!p) return 0;
    p+=strlen(search);
    const char *end=strpbrk(p,"& \r\n\0");
    int len=end ? (int)(end-p) : (int)strlen(p);
    if(len>=outLen) len=outLen-1;
    strncpy(out,p,len);
    out[len]=0;
    return 1;
}

/* ดึง JSON string value  "key":"value" */
static int getJsonStr(const char *json, const char *key, char *out, int outLen){
    char search[64];
    snprintf(search,sizeof(search),"\"%s\"",key);
    const char *p=strstr(json,search);
    if(!p) return 0;
    p+=strlen(search);
    /* skip whitespace and colon */
    while(*p && (*p==':'||*p==' '||*p=='\t')) p++;
    if(*p!='"') return 0;
    p++;
    int i=0;
    /* copy bytes until closing quote, handling \uXXXX and escaped chars
       UTF-8 bytes are > 0x7F — copy them as-is (opaque)               */
    while(*p && i<outLen-1){
        unsigned char ch = (unsigned char)*p;
        if(ch == '"') break;          /* end of string */
        if(ch == '\\'){               /* escape sequence */
            p++;
            ch = (unsigned char)*p;
            switch(ch){
                case '"':  out[i++]='"';  break;
                case '\\': out[i++]='\\'; break;
                case '/':  out[i++]='/';  break;
                case 'n':  out[i++]='\n'; break;
                case 'r':  out[i++]='\r'; break;
                case 't':  out[i++]='\t'; break;
                case 'u':{
                    /* \uXXXX — copy raw bytes for now, JS already sent UTF-8 */
                    out[i++]='?'; p+=4; /* skip 4 hex digits */
                    break;
                }
                default: out[i++]=(char)ch; break;
            }
        } else {
            /* UTF-8: copy all bytes of this character (may be 1-4 bytes) */
            out[i++]=(char)ch;
        }
        p++;
    }
    out[i]=0;
    return i>0 || *p=='"'; /* return 1 even for empty string */
}

static int getJsonInt(const char *json, const char *key, int *out){
    char buf[32];
    char search[64];
    snprintf(search,sizeof(search),"\"%s\"",key);
    const char *p=strstr(json,search);
    if(!p) return 0;
    p+=strlen(search);
    while(*p && (*p==':'||*p==' ')) p++;
    int i=0;
    while(*p && (*p=='-'||((*p>='0')&&(*p<='9'))) && i<31) buf[i++]=*p++;
    buf[i]=0;
    *out=atoi(buf);
    return 1;
}

/* แปลง day index กลับเป็น YYYY-MM-DD (base year 2026) */
static void dayIndexToDate(int dayIdx, char *out){
    int year=2026;
    int remaining=dayIdx;
    int daysInYear;
    while(1){
        daysInYear=isLeap(year)?366:365;
        if(remaining<=daysInYear) break;
        remaining-=daysInYear;
        year++;
    }
    int month=0;
    int d[]={31,28,31,30,31,30,31,31,30,31,30,31};
    if(isLeap(year)) d[1]=29;
    while(remaining>d[month]){ remaining-=d[month]; month++; }
    sprintf(out,"%04d-%02d-%02d",year,month+1,remaining);
}

/* ══════════════════════════════════════════════════════════════
   Handlers
   ══════════════════════════════════════════════════════════════ */

/* GET /availability?start=YYYY-MM-DD&end=YYYY-MM-DD
   Response:
   {
     "ok": true,
     "startDay": 10,
     "endDay":   12,
     "cars": [
       { "number":1, "id":990, "model":"Toyota Altis Grey",
         "available": true },
       ...
     ]
   }
*/
static void handleAvailability(int sock, const char *url){
    char startStr[20]="", endStr[20]="";
    getParam(url,"start",startStr,20);
    getParam(url,"end",  endStr,  20);

    int s=dateToDayIndex(startStr);
    int e=dateToDayIndex(endStr);
    if(s<0||e<0||e<s){
        sendResponse(sock,400,"{\"ok\":false,\"error\":\"invalid date range\"}");
        return;
    }

    loadCars();

    char body[8192];
    int pos=0;
    pos+=snprintf(body+pos,sizeof(body)-pos,
        "{\"ok\":true,\"startDay\":%d,\"endDay\":%d,\"cars\":[",s,e);

    for(int i=0;i<numCars;i++){
        int avail=isAvailable(i,s,e);
        pos+=snprintf(body+pos,sizeof(body)-pos,
            "%s{\"number\":%d,\"pricePerDay\":%d,\"model\":\"%s\",\"available\":%s}",
            i>0?",":"",
            cars[i].number,
            cars[i].id,
            cars[i].model,
            avail?"true":"false");
    }
    pos+=snprintf(body+pos,sizeof(body)-pos,"]}");
    sendResponse(sock,200,body);
}

/* POST /book
   Body JSON:
   { "carNumber":1, "startDate":"2026-04-15", "endDate":"2026-04-17",
     "firstName":"สมชาย", "lastName":"ใจดี",
     "phone":"0812345678", "email":"a@gmail.com", "delivery":"สมุทรสาคร-เซ็นทรัลมหาชัย" }
*/
static void handleBook(int sock, const char *body){
    int carNumber=0;
    char startDate[20]="",  endDate[20]="";
    char fname[256]="",     lname[256]="",   phone[32]="",    email[128]="";
    char idCard[32]="",     location[80]="", payMethod[20]="";
    char cardName[128]="",  cardNumber[32]="";
    char timeOrCvv[16]="",  expiry[12]="",   total[20]="";

    /* carNumber / carId */
    if(!getJsonInt(body,"carNumber",&carNumber))
        getJsonInt(body,"carId",&carNumber);

    /* dates & location */
    getJsonStr(body,"startDate",   startDate,  20);
    getJsonStr(body,"endDate",     endDate,    20);
    getJsonStr(body,"deliveryValue",location,  80);

    /* customer */
    if(!getJsonStr(body,"firstName",fname,256)) getJsonStr(body,"first_name",fname,256);
    if(!getJsonStr(body,"lastName", lname,256)) getJsonStr(body,"last_name", lname,256);
    getJsonStr(body,"phone",   phone,   32);
    getJsonStr(body,"email",   email,   128);
    getJsonStr(body,"idCard",  idCard,  32);

    /* payment */
    getJsonStr(body,"payMethod",   payMethod,  20);
    getJsonStr(body,"cardName",    cardName,   128);
    getJsonStr(body,"cardNumber",  cardNumber, 32);
    getJsonStr(body,"timeOrCvv",   timeOrCvv,  16);
    getJsonStr(body,"expiry",      expiry,     12);
    getJsonStr(body,"total",       total,      20);

    printf("[BOOK] carNumber=%d start=%s end=%s fname=%s lname=%s pay=%s total=%s\n",carNumber, startDate, endDate, fname, lname, payMethod, total);

    /* validate */
    if(carNumber<1||!startDate[0]||!endDate[0]||!fname[0]||!lname[0]){
        sendResponse(sock,400,"{\"ok\":false,\"error\":\"missing fields\"}");
        return;
    }

    loadCars();

    int carIdx=-1;
    for(int i=0;i<numCars;i++){
        if(cars[i].number==carNumber){ carIdx=i; break; }
    }
    if(carIdx<0){
        sendResponse(sock,400,"{\"ok\":false,\"error\":\"car not found\"}");
        return;
    }

    int s=dateToDayIndex(startDate);
    int e=dateToDayIndex(endDate);
    if(s<0||e<0||e<s){
        sendResponse(sock,400,"{\"ok\":false,\"error\":\"invalid dates\"}");
        return;
    }

    if(!isAvailable(carIdx,s,e)){
        sendResponse(sock,200,"{\"ok\":false,\"error\":\"car not available on selected dates\"}");
        return;
    }

    bookCar(carIdx,s,e);

    srand((unsigned)time(NULL));
    char refCode[16];
    snprintf(refCode,sizeof(refCode),"RM-%06d",100000+(rand()%900000));

    /* บันทึก customer พร้อม fields ใหม่ทั้งหมด */
    saveCustomer(cars[carIdx].model, fname, lname, phone, email, idCard, startDate, endDate, location,payMethod, cardName, cardNumber, timeOrCvv, expiry, total);

    int numDays=(e-s)+1;
    if(numDays<1) numDays=1;

    char resp[256];
    snprintf(resp,sizeof(resp),"{\"ok\":true,\"refCode\":\"%s\",\"numDays\":%d}",refCode, numDays);
    sendResponse(sock,200,resp);
}

/* POST /cancel
    Body: { "firstName":"สมชาย", "lastName":"ใจดี" }
*/
static void handleCancel(int sock, const char *body){
    char fname[64]="", lname[64]="";
    getJsonStr(body,"firstName",fname,64);
    getJsonStr(body,"lastName", lname,64);
    if(!fname[0]||!lname[0]){
        sendResponse(sock,400,"{\"ok\":false,\"error\":\"missing name\"}");
        return;
    }

    loadCars();

    int carIdx=-1, s=-1, e=-1;
    int found=deleteCustomer(fname,lname,&carIdx,&s,&e);
    if(!found){
        sendResponse(sock,200,"{\"ok\":false,\"error\":\"customer not found\"}");
        return;
    }
    if(carIdx>=0&&s>0&&e>0) cancelCar(carIdx,s,e);

    sendResponse(sock,200,"{\"ok\":true,\"message\":\"booking cancelled\"}");
}

/* POST /mybookings
   Body: { "firstName":"สมชาย", "lastName":"ใจดี" }
   Response:
   {
     "ok": true,
     "bookings": [
       { "car":"Toyota Vios White", "startDate":"2026-04-15",
         "endDate":"2026-04-17", "delivery":"NO", "recordDate":"2026-04-10" }
     ]
   }
*/
void handleMyBookings(int client, const char *jsonBody) {
    /* ── parse ชื่อ-นามสกุลจาก JSON ด้วย getJsonStr ที่รองรับ UTF-8 ── */
    char reqF[256]="", reqL[256]="";
    if(!getJsonStr(jsonBody,"firstName",reqF,256))
        getJsonStr(jsonBody,"first_name",reqF,256);
    if(!getJsonStr(jsonBody,"lastName",reqL,256))
        getJsonStr(jsonBody,"last_name",reqL,256);

    if(!reqF[0]||!reqL[0]){
        sendResponse(client,400,"{\"ok\":false,\"error\":\"missing name\"}");
        return;
    }

    FILE *f = fopen(CUST_FILE, "r");
    if(!f) {
        fprintf(stderr,"[ERR] cannot open %s\n", CUST_FILE);
        sendResponse(client, 500, "{\"ok\":false,\"error\":\"Cannot open customer database\"}");
        return;
    }

    /* ── buffer JSON response ── */
    /* NEW CUSTOMER.csv columns (0-based, 16 total):
       0=car       1=fname      2=lname      3=phone      4=email
       5=idCard    6=startDate  7=endDate    8=location   9=recordDate
       10=payMethod 11=cardName 12=cardNumber 13=timeOrCvv 14=expiry 15=total */
    char resbuf[32768];
    int  pos   = 0;
    int  found = 0;

    pos += snprintf(resbuf+pos, sizeof(resbuf)-pos, "{\"ok\":true,\"bookings\":[");

    char line[2048];
    int isHeader = 1;

    while(fgets(line, sizeof(line), f)){
        if(isHeader){ isHeader=0; continue; }
        if(line[0]=='\n'||line[0]=='\r'||line[0]=='\0') continue;

        char tmp[2048];
        strncpy(tmp, line, sizeof(tmp)-1);
        tmp[sizeof(tmp)-1]=0;

        char *col[16];
        int   nc = 0;
        char *tok = strtok(tmp, ",");
        while(tok && nc < 16){
            tok[strcspn(tok,"\r\n")] = 0;
            col[nc++] = tok;
            tok = strtok(NULL, ",");
        }
        if(nc < 8) continue;

        if(strcmp(col[1], reqF)!=0 || strcmp(col[2], reqL)!=0) continue;

        /* escape double-quotes in car name */
        char carEsc[128]="";
        int  ei = 0;
        for(int k=0; col[0][k] && ei<126; k++){
            if(col[0][k]=='"') carEsc[ei++]='\\';
            carEsc[ei++] = col[0][k];
        }
        carEsc[ei]=0;

        /* new column layout */
        const char *startDate  = (nc>6)  ? col[6]  : "";
        const char *endDate    = (nc>7)  ? col[7]  : "";
        const char *location   = (nc>8)  ? col[8]  : "";
        const char *recordDate = (nc>9)  ? col[9]  : "";
        const char *payMethod  = (nc>10) ? col[10] : "";
        const char *total      = (nc>15) ? col[15] : "";

        pos += snprintf(resbuf+pos, sizeof(resbuf)-pos,
            "%s{\"car\":\"%s\","
             "\"startDate\":\"%s\","
             "\"endDate\":\"%s\","
             "\"delivery\":\"%s\","
             "\"recordDate\":\"%s\","
             "\"payMethod\":\"%s\","
             "\"total\":\"%s\"}",
            found ? "," : "",
            carEsc, startDate, endDate, location, recordDate, payMethod, total);
        found++;
    }
    fclose(f);

    pos += snprintf(resbuf+pos, sizeof(resbuf)-pos, "]}");
    printf("[MYBOOKINGS] fname=%s lname=%s found=%d\n", reqF, reqL, found);
    sendResponse(client, 200, resbuf);
}

/* ══════════════════════════════════════════════════════════════
    Main server loop
   ══════════════════════════════════════════════════════════════ */
int main(void){
#ifdef _WIN32
    WSADATA wsa; WSAStartup(MAKEWORD(2,2),&wsa);
#endif
 
    int server=socket(AF_INET,SOCK_STREAM,0);
    if(server<0){ perror("socket"); return 1; }
 
    int opt=1;
    setsockopt(server,SOL_SOCKET,SO_REUSEADDR, &opt,sizeof(opt));
 
    struct sockaddr_in addr;
    memset(&addr,0,sizeof(addr));
    addr.sin_family     =AF_INET;
    addr.sin_addr.s_addr=INADDR_ANY;
    addr.sin_port       =htons(PORT);
 
    if(bind(server,(struct sockaddr*)&addr,sizeof(addr))<0){
        perror("bind"); return 1;
    }
    listen(server,10);
    printf("[INFO] RODCHAOMAHACHAI backend running on http://localhost:%d\n",PORT);
    printf("[INFO] Place CAR.csv and CUSTOMER.csv in the same directory.\n");
    printf("[INFO] Press Ctrl+C to stop.\n");
 
    while(1){
        struct sockaddr_in caddr;
        socklen_t clen=sizeof(caddr);
        int client=accept(server,(struct sockaddr*)&caddr,&clen);
        if(client<0) continue;
 
        char req[BUF];
        int n=recv(client,req,BUF-1,0);
        if(n<=0){ close(client); continue; }
        req[n]=0;
 
        /* แยก method และ path */
        char method[8]="", path[256]="";
        sscanf(req,"%7s %255s",method,path);
 
        printf("[REQ] %s %s\n",method,path);
 
        /* OPTIONS preflight (CORS) */
        if(strcmp(method,"OPTIONS")==0){
            sendResponse(client,200,"{}");
            close(client); continue;
        }
 
        /* หา body (หลัง \r\n\r\n) */
        const char *bodyStart=strstr(req,"\r\n\r\n");
        const char *jsonBody = bodyStart ? bodyStart+4 : "";
 
        if(strncmp(path,"/availability",13)==0){
            handleAvailability(client, path);
        }
        else if(strcmp(path,"/book")==0 && strcmp(method,"POST")==0){
            handleBook(client, jsonBody);
        }
        else if(strcmp(path,"/cancel")==0 && strcmp(method,"POST")==0){
            handleCancel(client, jsonBody);
        }
        else if(strcmp(path,"/mybookings")==0 && strcmp(method,"POST")==0){
            handleMyBookings(client, jsonBody);
        }
        else if(strcmp(path,"/status")==0){
            sendResponse(client,200,"{\"ok\":true,\"service\":\"RODCHAOMAHACHAI\"}");
        }
        else{
            sendResponse(client,404,"{\"ok\":false,\"error\":\"not found\"}");
        }
 
        close(client);
    }
 
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}