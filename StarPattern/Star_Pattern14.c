#include <stdio.h>
int main()//แปดทิศ//
{
    int n,i,j;
    scanf("%d",&n);
    for(i=0;i<n/2;i++)
    {
        for(j=0;j<i;j++) printf("  ");
        printf("*");
        for(j=n/2;j>i+1;j--) printf("  ");
        printf(" *");
        for(j=n/2;j>i+1;j--) printf("  ");
        printf(" *");
        printf("\n");
    }
    for(j=0;j<n;j++) printf("* ");
    printf("\n");
    for(i=0;i<n/2;i++)
    {
        for(j=i+1;j<n/2;j++) printf("  ");
        printf("*");
        for(j=0;j<i;j++) printf("  ");
        printf(" *");
        for(j=0;j<i;j++) printf("  ");
        printf(" *");
        printf("\n");
    }
}