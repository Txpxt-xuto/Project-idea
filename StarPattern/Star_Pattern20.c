#include <stdio.h>
int main()//ลูกศรชี้ทางทิศตะวันออกเฉียงใต้//
{
    int n,i,j;
    scanf("%d",&n);
    for(i=0;i<n/2;i++)
    {
        for(j=0;j<i;j++) printf("  ");
        printf(" * ");
        for(j=2;j<n-2*i;j++) printf("  ");
        for(j=0;j<=i;j++) printf("* ");
        printf("\n");
    }
    for(i=n/2;i<n;i++)
    {
        for(j=n;j>i+1;j--) printf("  ");
        for(j=0;j<=i;j++) printf(" *");
        printf("\n");
    }
}